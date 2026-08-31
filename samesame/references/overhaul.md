# Overhaul mode — new look, nothing lost

The functional inventory is ground truth. The visual delta is the point; the defect would be a capability that quietly vanishes. Every finding is a *treatment*: a proposed mapping from an inventory item to its place in the new design.

## Direction comes from the user

Before planning any treatment, establish the design direction — and it must be theirs:

- **Sources to ask for**: an org design system or component library, brand tokens (colors, type, spacing), reference pages or products they like ("make it feel like X"), an existing style guide, mockups if any exist.
- **Constraints to ask about**: what must not change even visually — URLs, DOM ids/test hooks automated tests rely on, accessibility requirements, print views, keyboard behavior users depend on.
- **If the user has no direction yet**: help them find one by asking about audience and adjectives, and — only if they ask — propose two or three distinct directions *as options with named trade-offs*, each applied to one representative route as a capture they can look at. The user picks. Proceeding on a direction the user never chose violates the skill's reason to exist.

Record the chosen direction in the plan header in the user's words. It is the standard every treatment is checked against — not your taste.

## The coverage contract

The plan maps **every** inventory item (`R3-C2` …) to a treatment: where it lives in the new design and how it is presented. Three treatment values:

- `carry` — same capability, restyled (the default; most items)
- `recompose` — same capability, different structure (a table becomes cards; a menu folds into a drawer) — name what changes about *reaching* it
- `drop` — proposed removal; goes in a separate **Removals** section the user must approve item by item. An unapproved removal is a bug.

No inventory item may be absent from the map. "I redesigned the page and the bulk-export button didn't fit" is exactly the failure this mode exists to prevent.

## Execution order

1. **Foundations first**: tokens, typography, spacing, shared primitives (buttons, inputs, cards) — so routes are built on a settled base and the design stays coherent instead of drifting route by route.
2. **One representative route** end-to-end, captured, for the user to look at early. Cheap course-correction beats a consistent mistake applied forty times.
3. **Remaining routes** in the user's priority order.

Per route increment:

1. Apply the approved treatments.
2. **Coverage check** (mechanical where the harness allows): every `carry`/`recompose` item on the route is present and wired — the control exists with its accessible name, the form still has its fields and submit target, the data fields still render, the behavior's trigger is reachable. Presence and wiring, not full end-to-end testing.
3. Re-capture the route; the after-shots land in `captures/next/` for the user's review. In this mode there is no pixel target — *the user's eyes are the acceptance test for the look; the coverage check is the acceptance test for the functionality.*
4. Anything that stops fitting the design mid-implementation becomes a question with a capture attached — never a silent `drop`, never a silent `recompose` of an approved `carry`.
5. Checkpoint; update `state.json` and `PLAN.md`.

## Honesty rules

- Never present the new design as an improvement; present it as *conforming to the direction you chose* and let them judge.
- Consistency findings are fair game to surface ("route 7's buttons diverge from the primitives approved in the foundations step") because they are measured against the user's own direction — not against taste.
- If the direction and the coverage contract collide (the new nav genuinely cannot hold all twelve sections), say so early, with the specific items, as a question. The user resolves it; the contract does not bend on its own.
