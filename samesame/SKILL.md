---
name: samesame
description: >
  Carry a codebase's UI through a transition without losing what matters. Use
  when a port/migration/upgrade works functionally but the UI looks wrong and
  should match the original ("the port looks utterly different"), or when the
  user wants a UI overhaul that must not break existing functionality
  ("redesign it, same features"), or when the user invokes "samesame" by name.
  Covers: building a local ground-truth harness (screenshots + computed
  styles), writing an itemized plan for approval, and converging in
  checkpointed, resumable increments. Not for greenfield UI with no existing
  version, one-off CSS tweaks, or functional bug fixing.
---

# Samesame

*Same same, but different.*

Samesame governs the transition of a UI while its functionality stays fixed. It works in two directions: keep the look on a new stack (a port that should be **same same**), or keep the behavior under a new look (an overhaul that should be **but different**). In both, the failure mode it exists to remove is the same — a person spending hours being the agent's eyes, finding each divergence, describing it in words, and verifying the fix, until doing the work manually becomes cheaper.

While this skill is active you build the instruments so nobody has to do that: a local ground-truth harness that captures both versions, a measured plan the person approves once, and a convergence loop that runs in small, checkpointed, resumable increments.

Samesame is not:

- a redesign oracle — it never decides what looks better; direction and acceptance belong to the user
- a cloud service — nothing leaves the machine; no external diff/screenshot services, ever
- a big-bang rewriter — no code changes before plan approval, and every increment is small enough to review and revert

## Principles (non-negotiable)

Any change in behaviour that violates one of these is a regression, even if it "improves" the output.

1. **Functionality is the invariant; the UI is the variable.** Every route, control, form, field, and behavior in the original must survive the transition. Anything that would be dropped is surfaced as a question — never decided silently, in either mode.
2. **Ground truth over description.** Never ask the user to describe a visual difference the harness can measure. Capture both versions and diff them. The human triages findings; the agent does the seeing.
3. **Plan before touch.** No code changes until the plan file is approved. One approval gate, explicit, recorded in the plan. Items added later need approval for those items only.
4. **Nothing leaves the machine.** Local tooling only (project-isolated npm dev-deps, or no tooling at all via fallbacks). No uploads, no cloud rendering, no telemetry. All artifacts live in a gitignored `.samesame/` directory inside the target project.
5. **Never "close enough".** Thresholds, acceptances, and design direction are the user's. Report measurements, not verdicts. An empty divergence list is a valid, complete result — do not invent findings.
6. **Resumable by design.** Every completed item is checkpointed and recorded in a state file. "continue samesame" resumes exactly where work stopped, after an hour or a month. Built for people with thirty spare minutes, not three spare days.

## Triggers

Run Samesame when a UI transition needs to preserve something:

- explicit: "samesame this migration", "run samesame", "continue samesame"
- match-shaped: "the port works but looks completely different", "make the new version look like the old one", "the upgrade broke the styling everywhere"
- overhaul-shaped: "redesign the UI but don't break anything", "modernize the look, keep every feature", "move to our new design system without losing functionality"

Do not run Samesame for: building a new UI with no existing version to preserve, fixing a functional bug, or an ordinary "adjust this button's styling" request.

## Workflow

```
intent → classify mode ∈ { match | overhaul }
      → feasibility            (both versions reachable? pick harness tier)
      → inventory              (references/inventory.md)
      → capture                (references/harness.md)
      → plan file → APPROVAL   (references/plan-format.md)
      → execute loop           (references/match.md | references/overhaul.md)
        per item: change → re-capture → re-verify → checkpoint
      → leave-behind gate      (the harness stays; re-run it any time)
```

### 1. Classify

| Mode | Condition |
|---|---|
| `match` | The two versions should look the same and don't. The visual delta is the defect. Ports, framework upgrades, dependency bumps, library swaps. |
| `overhaul` | The new version should look deliberately different but behave the same. The functional delta is the defect. Redesigns, rebrands, design-system adoptions. |

- Ambiguous ("upgrade the UI"): ask one question — *should the result look like the current version, or is a new look the point?* Do not guess.
- Both in one project (port, then redesign): run `match` to a stable baseline first, then `overhaul`. Never both at once on the same route — there would be no ground truth left to verify against.

### 2. Feasibility

Establish how both versions can be reached, and pick the highest available harness tier (details in `references/harness.md`):

1. **Full harness** — both versions run locally (or on an intranet URL); Playwright captures screenshots and computed styles.
2. **Screenshot folder** — the user supplies captures by hand following a naming convention; diffing still runs locally if Node is available.
3. **Agent vision** — no tooling installable at all; the agent compares screenshot pairs with its own vision and says plainly that findings are qualitative, not measured.

`match` mode with no visual ground truth at all (legacy app gone, no screenshots, no deployed copy) is refused honestly: there is nothing to match. Offer `overhaul` mode against a written functional inventory instead.

### 3. Inventory

Read `references/inventory.md`. Enumerate routes, states, breakpoints, and — for `overhaul` — the per-route functional inventory (controls, forms, fields, behaviors). The inventory is written to `.samesame/inventory.md` and confirmed as part of plan approval, not as a separate round.

### 4. Capture

Read `references/harness.md`. Set up `.samesame/harness/` (its own `package.json`; the project's dependencies are never touched), write `config.json` from the inventory, capture both versions, run the diff. Captures and diff overlays are local PNG files the user can open directly.

### 5. Plan and approval

Read `references/plan-format.md`. Write `.samesame/PLAN.md`: header (mode, targets, breakpoints, threshold, checkpoint policy), inventory confirmation, and one item per finding with evidence links and a decision column. Present the plan location and a short summary in chat, then stop. **No code changes until the user approves.** Record decisions and the approval in the plan file.

### 6. Execute

Read the mode's reference (`references/match.md` or `references/overhaul.md`). Work the approved items smallest-cause-first, one at a time: change, re-capture affected routes, re-verify, checkpoint, update `state.json`. Stop cleanly whenever asked; "continue samesame" resumes from the state file.

### 7. Leave-behind

The harness remains in `.samesame/harness/` with a one-command re-run. Offer (do not impose) wiring it into CI or a pre-merge check.

## Edge cases

- **Auth walls**: capture a logged-in storage state once (the user logs in manually in the harness browser); reuse it for both versions. Never ask for credentials in chat.
- **Dynamic data** (clocks, feeds, randomized content): seed fixture data where possible; otherwise mask the volatile regions at capture time and record the masked selectors in the plan header.
- **Animations**: frozen at capture time by injected CSS; noted in the harness recipe.
- **Huge route count**: capture a user-ranked top slice first; the plan stays open for later slices. Do not boil the ocean before the first approval.
- **Font/anti-aliasing noise**: sub-threshold rendering differences across engines are named as known noise, not findings. The threshold is the user's number.
- **A divergence that won't converge** (e.g., the old plugin no longer exists): stop, present the options — nearest equivalent, rebuild, accept the difference — as a question with evidence. Never substitute silently.
- **User asks which version looks better**: decline gently; Samesame measures sameness and difference, it does not hold taste.
- **Windows**: all harness scripts use portable path handling; nothing assumes a POSIX shell beyond `npm`/`node`.

## Vocabulary

"Converge", "preserve", "surface", "checkpoint" — never "fix the design", "improve the look", "good enough". In `match` mode differences are *divergences* (measured), in `overhaul` mode they are *treatments* (proposed). A finding the user marks `intentional` is recorded as their decision, in their words.
