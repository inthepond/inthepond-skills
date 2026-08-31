// samesame harness — capture a logged-in session without ever sharing credentials.
// Usage: node login.mjs <target>   (target = legacy | next)
// Opens a headed browser on the target; log in yourself; press Enter here when done.
// Saves the session to state-<target>.json (holds live tokens — stays in gitignored .samesame/).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, 'config.json'), 'utf8'));
const target = process.argv[2];
if (!config.targets[target]) {
  console.error(`Usage: node login.mjs <target>. Targets: ${Object.keys(config.targets).join(', ')}`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: false, ...(config.browserChannel ? { channel: config.browserChannel } : {}) });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(config.targets[target]);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await rl.question(`Log in to ${config.targets[target]} in the browser window, then press Enter here... `);
rl.close();

const out = join(here, `state-${target}.json`);
await context.storageState({ path: out });
await browser.close();
console.log(`saved ${out} — set "storageState" in config.json to use it`);
