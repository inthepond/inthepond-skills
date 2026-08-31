# Plan and state — the approval gate and the resume point

Everything Samesame produces lives in `.samesame/` inside the target project (gitignored):

```
.samesame/
  PLAN.md          the plan: header, inventory confirmation, items, decisions, approval
  inventory.md     the inventory (references/inventory.md)
  state.json       machine state for resumability
  harness/         scripts + config (references/harness.md)
  captures/        screenshots + computed styles, per target
  diffs/           overlay images + report.json (match mode)
```

## PLAN.md

The plan is one markdown file the user can read top to bottom and edit directly. Shape:

```markdown
# samesame plan — <project>

mode: match | overhaul
tier: full harness | screenshot folder | agent vision
legacy: <url or "screenshots supplied">        next: <url>
breakpoints: mobile 375, desktop 1440
threshold: 1.0% (yours to change)              # match mode
direction: "<the user's words>"                # overhaul mode
masked: #clock, .ad-slot
checkpoints: none | commit                     # see below
approved: NO — nothing will be changed until you approve

## Inventory confirmation
- Routes I could not reach or resolve: …
- Routes/items I propose to leave out of scope: …

## Items
| id | scope | evidence | cause / treatment | proposed action | decision | status |
|----|-------|----------|-------------------|-----------------|----------|--------|
| G1 | all routes | diffs/report.json, diffs/home/desktop.png | global stylesheet not loaded | port app.css into the new build | fix | pending |
| R4a | /orders | diffs/orders/mobile.png | icon font missing | ship icon assets | — | pending |

## Removals (overhaul mode only)
| id | item | reason proposed | decision |
```

Rules:

- **Evidence is a relative path** to a real local file (an overlay PNG, a report entry) the user can open. No claim without something to look at — except at the agent-vision tier, where evidence is your description and says so.
- **Group by cause** (match) or by route (overhaul). Item ids are stable forever; new findings get new ids, they never reuse old ones.
- **Decision vocabulary** — match: `fix` / `intentional` / `defer`; overhaul: `approve` / `change: <note>` / `drop`. Decisions are filled by the user, in the file or in chat; either way you write them into the plan so the file stays the single record.
- **`intentional` items** are recorded with the user's stated reason, in their words.
- **Checkpoint policy**: `commit` makes one commit per converged item/route (recommended — auditable and revertable, message prefix `samesame:`); `none` leaves the working tree for the user to commit. Default is `none`; recommend `commit` in the plan and let them flip it. Never push, ever.

## Approval protocol

1. Write PLAN.md, tell the user where it is with a three-sentence summary in chat, and stop.
2. The user decides per item and approves. Approval must be explicit ("approved", "go", a filled decision column plus "start") — silence or an ambiguous reply is not approval; ask.
3. Flip `approved:` to `YES — <date>, <how it was given>` and begin.
4. **Scope changes after approval** (new findings from a re-capture, a new route slice): append as new items marked `pending — not yet approved`, surface them in chat, and touch nothing they cover until approved. Never re-litigate already-approved items; never treat a new finding as pre-approved because it resembles an old one.

## state.json

Written after every increment; the resume point. Shape (adapt fields, keep the spirit — anyone should be able to reconstruct where work stopped from this file alone):

```json
{
  "mode": "match",
  "tier": "full",
  "approvedAt": "2026-08-31",
  "threshold": 1.0,
  "items": {
    "G1": { "status": "converged", "how": "below threshold", "checkpoint": "a1b2c3d" },
    "R4a": { "status": "in-progress" }
  },
  "nextUp": "R4a",
  "lastCapture": { "target": "next", "at": "2026-08-31T10:12:00+10:00" }
}
```

## Resuming

On "continue samesame": read `state.json` and `PLAN.md`, report position in one short paragraph — items converged / in progress / pending, what's next — and continue with `nextUp`. If the working tree changed since `lastCapture` (the user worked in between), re-capture before trusting any old diff. If state and plan disagree, the plan file wins and say so.
