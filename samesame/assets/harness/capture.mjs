// samesame harness — capture screenshots + computed styles for each target × breakpoint × route.
// Usage: node capture.mjs [target]   (target = legacy | next; omit to capture all)
// Config: ./config.json — see the samesame skill's references/harness.md.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, 'config.json'), 'utf8'));
const outRoot = join(here, '..', 'captures');

// Freeze motion so we never diff a moving target.
const FREEZE_CSS = `*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}`;

const only = process.argv[2];
const targets = Object.entries(config.targets).filter(([name]) => !only || name === only);
if (targets.length === 0) {
  console.error(`No such target "${only}". Targets: ${Object.keys(config.targets).join(', ')}`);
  process.exit(1);
}

const storageStateFor = (target) => {
  const s = config.storageState;
  if (!s) return undefined;
  return typeof s === 'string' ? join(here, s) : s[target] ? join(here, s[target]) : undefined;
};

// browserChannel: use an already-installed browser ("chrome", "msedge") when the
// Playwright browser download is blocked by a proxy or sandbox.
const browser = await chromium.launch(config.browserChannel ? { channel: config.browserChannel } : {});
for (const [target, baseUrl] of targets) {
  for (const bp of config.breakpoints) {
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
      storageState: storageStateFor(target),
    });
    const page = await context.newPage();
    for (const route of config.routes) {
      const url = baseUrl.replace(/\/$/, '') + route.path;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        if (route.waitFor) await page.waitForSelector(route.waitFor, { timeout: 10_000 });
        if (route.settleMs) await page.waitForTimeout(route.settleMs);
        await page.addStyleTag({ content: FREEZE_CSS });

        const dir = join(outRoot, target, route.slug);
        mkdirSync(dir, { recursive: true });
        await page.screenshot({
          path: join(dir, `${bp.name}.png`),
          fullPage: true,
          mask: (route.mask ?? []).map((sel) => page.locator(sel)),
        });

        const landmarks = [...config.landmarks, ...(route.landmarks ?? [])];
        const styles = await page.evaluate(({ landmarks, props }) => {
          const out = {};
          for (const sel of landmarks) {
            const el = document.querySelector(sel);
            if (!el) { out[sel] = null; continue; }
            const cs = getComputedStyle(el);
            out[sel] = Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
          }
          return out;
        }, { landmarks, props: config.styleProps });
        writeFileSync(join(dir, `${bp.name}.styles.json`), JSON.stringify(styles, null, 2));

        console.log(`captured ${target}/${route.slug}/${bp.name}`);
      } catch (err) {
        console.error(`FAILED  ${target}/${route.slug}/${bp.name}: ${err.message}`);
        process.exitCode = 1;
      }
    }
    await context.close();
  }
}
await browser.close();
