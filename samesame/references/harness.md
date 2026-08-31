# Harness — capture and diff, all local

The harness lives in `.samesame/harness/` inside the target project, with its own `package.json`. **The project's own `package.json`, lockfile, and node_modules are never touched.** Add `.samesame/` to the project's `.gitignore` (this edit is covered by plan approval).

Three tiers. Always use the highest one available; name the tier in the plan header so the user knows what the findings are worth.

## Tier 1 — full harness (Playwright + pixelmatch)

Requires: `node`/`npm` and the ability to install dev packages locally. Copy the script templates from this skill's `assets/harness/` into `.samesame/harness/`, then:

```
cd .samesame/harness
npm install
npx playwright install chromium   # downloads a local browser; proxy users may need HTTPS_PROXY set
```

If the browser download is blocked (corporate proxy, sandbox), skip `playwright install` and set `"browserChannel": "chrome"` (or `"msedge"`) in `config.json` — Playwright then drives the browser already installed on the machine. Check for one before declaring tier 1 unavailable.

Write `config.json` next to the scripts, generated from the inventory:

```json
{
  "targets": {
    "legacy": "http://localhost:8000",
    "next":   "http://localhost:4200"
  },
  "breakpoints": [
    { "name": "mobile",  "width": 375,  "height": 812 },
    { "name": "desktop", "width": 1440, "height": 900 }
  ],
  "routes": [
    { "slug": "home",   "path": "/",          "waitFor": "main" },
    { "slug": "orders", "path": "/orders/17", "waitFor": "main", "mask": ["#clock"], "settleMs": 300 }
  ],
  "landmarks": ["header", "nav", "main", "footer"],
  "styleProps": [
    "display", "position", "width", "height", "margin", "padding",
    "font-family", "font-size", "font-weight", "line-height", "letter-spacing",
    "color", "background-color", "border", "border-radius", "box-shadow",
    "flex-direction", "justify-content", "align-items", "gap",
    "text-align", "overflow"
  ],
  "storageState": null
}
```

- `targets` keys are fixed vocabulary: `legacy` (ground truth) and `next` (the version under change). In `overhaul` mode after the baseline capture, only `next` is re-captured.
- `landmarks` start as the structural elements above; per-route additions go in a route-level `"landmarks"` array once diagnosis needs finer instruments (a specific widget's selector).
- `mask` boxes out volatile regions before the screenshot; record masked selectors in the plan header.
- Animations/transitions/carets are frozen by injected CSS in the capture script — never diff a moving target.

Run:

```
node capture.mjs            # captures every target × breakpoint × route
node capture.mjs next       # re-capture only the changed side
node diff.mjs               # writes overlays + report.json, prints ranked table
```

Output layout (all under `.samesame/`, all plain files the user can open):

```
captures/legacy/<slug>/<breakpoint>.png
captures/legacy/<slug>/<breakpoint>.styles.json
captures/next/...                      (same shape)
diffs/<slug>/<breakpoint>.png          (pink-overlay diff image)
diffs/report.json                      (per pair: % pixels differing + computed-style deltas)
```

The scripts are templates, not sacred: adapt them to the project (a login step, a route that needs a click to reach a state) but keep the output layout stable — `diff.mjs`, the plan, and resumability all key off it.

### Auth (storage state)

Never ask for credentials. Run `node login.mjs <target>` (template alongside the others): it opens a headed browser, the user logs in themselves, and the session is saved to `state-<target>.json`; set `"storageState": "state-legacy.json"` (per-target values allowed: `{"legacy": ..., "next": ...}`). Point out that the state file holds live session tokens and stays inside gitignored `.samesame/`.

## Tier 2 — screenshot folder (no browser automation)

When Playwright cannot be installed (locked-down proxy, no browser download): the user captures screenshots by hand — any tool, full-page where possible — and drops them into the same layout: `captures/legacy/<slug>/<breakpoint>.png` and `captures/next/<slug>/<breakpoint>.png`. Give them the exact folder/file names generated from the inventory so naming is copy-paste.

If `node` + npm work at all, `diff.mjs` still runs (it needs only `pixelmatch` + `pngjs`, no browser). Computed-style evidence is unavailable — diagnosis in `match` mode falls back to reading the overlay and the code.

## Tier 3 — agent vision (no tooling at all)

Read each screenshot pair yourself and describe the divergences you can see, ranked by how much of the page they affect. State plainly in the plan header: *findings at this tier are qualitative — observed, not measured; there are no percentages and no computed-style evidence.* Do not fabricate metrics. Convergence at this tier means the user looks at the after-capture and accepts it.

## Re-capture discipline

After a change, re-capture only the routes the change could affect — but a change to anything global (a shared stylesheet, a layout component, tokens, a font) re-captures *everything*, because global causes are exactly the ones that leak. When in doubt, re-capture everything; captures are cheap, missed regressions are not.
