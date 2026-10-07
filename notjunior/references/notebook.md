# Notebook — `.notjunior/`

Optional, local, and personal: a place where the mistakes → learn → do better loop is written down, so each session builds on the last.

## The offer

In a first session in a project, offer it once, as the last line of the close — or in a drill's debrief — and in that one line say it stays out of git without touching the team's `.gitignore`. Offer at most once per session. If the person declines, nothing is written; carry what you learn within the conversation only.

- **No project** (concepts, rehearsal, or job hunting with no repository): no notebook.
- **The project asks that knowledge go in shared docs, not personal notes**: say so in the offer. The notebook holds the person's learning — their profile, misconceptions, questions — not project knowledge; anything worth sharing goes to the team's docs.

## Setup

- Create `.notjunior/` at the repository root.
- Exclude it locally by appending `.notjunior/` to `.git/info/exclude`. That keeps it out of git without touching the team's `.gitignore` — a useful thing to know in its own right.
- Not a git repository: ask where they want it.

Writing the notebook is the only writing this skill does.

## Files

**`profile.md`** — who is learning

```
# profile
updated: <date>
background: <in their words — degree, bootcamp, years, previous stacks>
goal: <onboarding | job hunting | getting better at …>
comfortable with: …
shaky on: …
what works: <e.g. examples before theory; short answers; diagrams>
```

**`map.md`** — the project, as understood so far

```
# map
as of: <short SHA> (<date>)

## lifecycle
<a few lines, cited>
## architecture
## stack
## traced features
- <feature> — <one line> (`entry path:line`)
```

Summaries only — a few lines per lens with their citations, never the full report.

**`questions.md`** — the "I don't know yet" list

```
# questions for the team
- [ ] <question> — from <lens>, <date> — ask: <who, if known>
- [x] <question> — answer: <in their words> (<who>, <date>)
```

**`log.md`** — what happened, including the mistakes

```
# log
## <date> — <lens>: <topic>
- explored: …
- misconception → corrected: <what they thought> → <what is true> (`cite`)
- explained well: …
- next: …
```

Only misconceptions the person stated go in the log — not ones relayed from someone else, and not ones merely implied.

## Resuming

At the start of each session, read `profile.md` and the last few `log.md` entries. Build on them: don't re-explain what they have already explained well; when a corrected misconception is relevant again, check it quickly. Mention open questions that touch the current topic — "you had an open question about how the queue retries; did you get an answer?"

## Staleness

Compare the SHA in `map.md` with `HEAD`: `git diff --stat <sha>..HEAD -- <cited paths>`. If cited files have changed, re-verify those claims before reusing them, then update the stamp. Never present a stale map entry as current.

## Privacy

These are the person's notes, not team documentation. They are never committed, never pushed, and never written anywhere except `.notjunior/`. If the person wants to share something from them — a questions list for their lead, say — they copy it out themselves.
