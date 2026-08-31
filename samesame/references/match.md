# Match mode — converge the new UI onto the old one

The legacy capture is ground truth. Every finding is a *divergence*: a measured difference between the two captures. The loop is: diagnose the cause → the user approves the fix list → converge cause by cause.

## Diagnose: styles first, pixels second

The pixel overlay says **where**; the computed-style delta says **why**. Always read `diffs/report.json`'s style deltas before staring at overlay images — `font-family: "Inter" → "Times New Roman"` on `main` is a diagnosis; a pink blob is not.

Classify each divergence by probable cause. The common causes, roughly in order of how often they explain everything at once:

| Cause | Typical evidence |
|---|---|
| Stylesheet missing or not loaded | many properties differ on many landmarks on many routes; network/console shows a 404 |
| Global CSS not ported (resets, utilities, overrides) | margins/paddings/box-sizing differ everywhere; typography off site-wide |
| Style encapsulation changed (global ↔ component-scoped) | a component's styles apply in one version and leak or vanish in the other |
| Font not shipped / fallback active | `font-family` resolves differently; text blocks reflow |
| Plugin/widget assets missing (its CSS, icon font, sprite) | one widget region diverges hard while the page around it matches |
| Different reset/normalize baseline | small consistent deltas: default margins, line-height, form control styling |
| Layout system assumptions (float/table era → flex/grid) | same content, different geometry; width/height/position deltas on containers |
| Icon delivery changed (icon font ↔ SVG) | glyph-sized boxes empty or tofu |
| JS-driven styling not ported (classes toggled at runtime, inline styles) | divergence appears only in interactive states |
| Stacking/z-index context changes | overlays behind content, dropdowns clipped |
| Viewport/meta/base-href differences | mobile breakpoint diverges while desktop matches |

One cause usually explains many divergences. Group findings by cause in the plan, not by route — the user approves "port the global stylesheet" once, not forty times.

## Converge: cause by cause, global first

Work approved items in this order: global causes (stylesheets, fonts, resets, tokens) → shared components (header, nav, layout shells) → per-route residue. After every global fix, re-capture **everything** and re-rank; a single global fix routinely collapses most of the list, and the remaining items deserve fresh evidence, not stale diagnosis.

Per item:

1. Make the smallest change that addresses the *cause* (port the stylesheet; ship the font; restore the scoping) — never write new CSS to chase pixels when the original CSS can be carried over.
2. Re-capture per the re-capture discipline in `harness.md`; re-run the diff.
3. The item converges when its pairs are at or below the plan's threshold, or the user accepts the residual by looking at it. Record which of the two it was.
4. Checkpoint (per the plan's checkpoint policy) with a message naming the cause: `samesame: converge global stylesheet port`.
5. Update `state.json` and the item's status in `PLAN.md`.

## Honesty rules

- **The threshold is the user's number.** Suggest a starting point (0.5–2% pixels differing is typical for "visually identical" pages once noise is excluded) but never tighten or loosen it yourself.
- **Known noise is named, not fixed.** Anti-aliasing, sub-pixel text rendering, and scrollbar differences between browser engines produce sub-threshold speckle. Say it is noise; do not burn increments polishing it, and do not use "noise" to wave away a real divergence — noise is scattered speckle, divergence has structure.
- **A divergence that cannot converge stops the loop for that item.** Old plugin unavailable, font unlicensed for the new stack, framework removes a capability: present the options (nearest equivalent, rebuild, accept the difference) with side-by-side evidence, and wait. Substituting silently is the one unforgivable move in this mode.
- **Never edit the legacy side.** Ground truth is read-only, even when the legacy version has a bug. If the user decides a legacy bug should not be preserved, that route's item is marked `intentional` in their words — the baseline is not doctored to make the diff pass.
