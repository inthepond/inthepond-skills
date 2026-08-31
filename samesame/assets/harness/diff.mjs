// samesame harness — diff captures/legacy against captures/next.
// Usage: node diff.mjs [pixelThreshold]   (per-pixel sensitivity 0..1, default 0.1)
// Writes ../diffs/<slug>/<breakpoint>.png overlays and ../diffs/report.json,
// prints pairs ranked by % pixels differing. Needs only pixelmatch + pngjs (no browser).
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const A = join(root, 'captures', 'legacy');
const B = join(root, 'captures', 'next');
const OUT = join(root, 'diffs');
const threshold = Number(process.argv[2] ?? 0.1);

if (!existsSync(A) || !existsSync(B)) {
  console.error('Need captures/legacy and captures/next. Run capture.mjs first (or fill them by hand — tier 2).');
  process.exit(1);
}

// Pad to a common canvas (white) so unequal page heights still diff.
function pad(png, width, height) {
  if (png.width === width && png.height === height) return png;
  const out = new PNG({ width, height });
  out.data.fill(255);
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

function styleDelta(aPath, bPath) {
  if (!existsSync(aPath) || !existsSync(bPath)) return null;
  const a = JSON.parse(readFileSync(aPath, 'utf8'));
  const b = JSON.parse(readFileSync(bPath, 'utf8'));
  const delta = {};
  for (const sel of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[sel] == null || b[sel] == null) {
      if ((a[sel] == null) !== (b[sel] == null)) delta[sel] = a[sel] == null ? 'only in next' : 'missing in next';
      continue;
    }
    const diffs = {};
    for (const prop of new Set([...Object.keys(a[sel]), ...Object.keys(b[sel])])) {
      if (a[sel][prop] !== b[sel][prop]) diffs[prop] = { legacy: a[sel][prop], next: b[sel][prop] };
    }
    if (Object.keys(diffs).length) delta[sel] = diffs;
  }
  return Object.keys(delta).length ? delta : null;
}

const rows = [];
for (const slug of readdirSync(A, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  for (const file of readdirSync(join(A, slug)).filter((f) => f.endsWith('.png'))) {
    const pair = { slug, breakpoint: file.replace(/\.png$/, '') };
    const bPng = join(B, slug, file);
    if (!existsSync(bPng)) { rows.push({ ...pair, missingInNext: true }); continue; }

    const a = PNG.sync.read(readFileSync(join(A, slug, file)));
    const b = PNG.sync.read(readFileSync(bPng));
    const width = Math.max(a.width, b.width);
    const height = Math.max(a.height, b.height);
    const diff = new PNG({ width, height });
    const differing = pixelmatch(pad(a, width, height).data, pad(b, width, height).data, diff.data, width, height, { threshold });

    mkdirSync(join(OUT, slug), { recursive: true });
    writeFileSync(join(OUT, slug, file), PNG.sync.write(diff));

    rows.push({
      ...pair,
      pctDiff: Number(((100 * differing) / (width * height)).toFixed(2)),
      sizeDelta: a.width !== b.width || a.height !== b.height ? { legacy: [a.width, a.height], next: [b.width, b.height] } : null,
      styleDelta: styleDelta(join(A, slug, file.replace(/\.png$/, '.styles.json')), join(B, slug, file.replace(/\.png$/, '.styles.json'))),
      overlay: join('diffs', slug, file),
    });
  }
}

rows.sort((x, y) => (y.pctDiff ?? 101) - (x.pctDiff ?? 101));
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'report.json'), JSON.stringify(rows, null, 2));

for (const r of rows) {
  const styled = r.styleDelta ? ` styles: ${Object.keys(r.styleDelta).join(', ')}` : '';
  console.log(r.missingInNext
    ? `MISSING  ${r.slug}/${r.breakpoint} — no capture on the next side`
    : `${String(r.pctDiff).padStart(6)}%  ${r.slug}/${r.breakpoint}${r.sizeDelta ? ' size!' : ''}${styled}`);
}
console.log(`\nreport: ${join(OUT, 'report.json')}`);
