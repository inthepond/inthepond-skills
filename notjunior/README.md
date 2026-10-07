# notjunior

*Know why, not just what.* A senior engineer beside you, with your codebase open.

![notjunior in four scenes: a developer asks why their PR goes through so many steps and gets the pipeline explained gate by gate, each claim cited to a file or labelled inferred, documented or unknown; they explain the merge queue back and the misconception is named plainly; Claude edits two files and a band above the prompt offers "Check I understand it", which asks five questions about the change; and at the commit, a toast reminds them the change hasn't been explained back yet](notjunior.gif)

Two things come up again and again. Graduates read textbook answers off a phone propped beside the monitor during interviews. And developers ship code their coding agent wrote without knowing what it does, or why the system around it is built the way it is — until there's an incident nobody can resolve.

Notjunior explains your project with evidence: how code gets to production, why the architecture has its shape, what each technology is for, how a feature actually runs, how incidents get handled. Then it asks you to explain it back. Work is a loop of making mistakes, learning, and doing better. "I don't know — here's how I'd find out" is treated as the senior answer it is.

Part of [inthepond-skills](../README.md).

## What it does

Eight lenses, chosen from your question:

| Lens | You ask | You get |
|---|---|---|
| **lifecycle** | "how does my code get to production?" | the journey of a change, stage by stage — what happens, the failure each gate prevents, what to do when it goes red, and what isn't there |
| **architecture** | "why is it built like this?" | three zooms (the system, the deployables, your component), each boundary with its protocol, trust, and blast radius, and the alternative not taken |
| **stack** | "what is X and why do we use it?" | each technology's job here, its alternatives, why it was chosen, what it costs, its sharp edges, and what to learn first |
| **trace** | "how does feature X actually work?" | an end-to-end walk with `file:line` per hop — data shape, error paths, what you'd see in the logs — then the unhappy path for you to trace yourself |
| **incident** | "prod is down" / "run a drill" | live: stabilise, escalate, preserve evidence — no lecture · drill: a game day built from your architecture, where you make the calls · readiness: how the project detects, alerts, and recovers |
| **concepts** | "explain CORS / idempotency properly" | in layers — one sentence, a picture (and where it breaks), the mechanics, where it lives in your code, good vs bad, how it fails |
| **own** | "Claude just wrote this — do I understand it?" | you explain the diff first; then what's not right, what the diff also does, what the reviewer will ask, and how you'd debug and roll it back at 3am |
| **rehearse** | "let me explain X" / "here's a job description" | feedback on accuracy, depth, precision, and honesty; your own phrasing tightened; mock-interviewer follow-ups; a job description mapped to what you've actually done |

Every claim about your project is cited to a file, a config key, or a commit. Every *why* is labelled **documented**, **inferred**, or **unknown**, and the unknowns become your questions for the team. When the docs and the code disagree, it shows you both — the code is what runs.

An optional, local `.notjunior/` notebook remembers what you know, what you've corrected, and what you still need to ask. It's kept out of git through `.git/info/exclude`, so the team's `.gitignore` is never touched.

## The mod

The skill only runs when you ask. The moment that matters most — code Claude wrote, about to ship unexplained — is when nobody asks. So notjunior also ships a Claude Code [mod](https://code.claude.com/docs/en/plugins/mods/overview) that watches the normal workflow:

- **A quiet band above the prompt** after a turn in which Claude changed files: *Claude changed 2 files you haven't explained back* · `[ Check I understand it ]` · `[ Later ]`. The check sends the `own` request in your words; Later hides the band until the next turn that edits files. File names that don't fit the width are counted rather than drawn, so the buttons are never pushed off the line.
- **The commit moment**: when Claude is about to `git commit`, `git push`, or `gh pr create` with changes still unexplained, the `shipCheck` setting decides — `nudge` (the default: a reminder, then it runs), `hold` (refused until you run the check), or `off`. Set it in `/config`.
- **`/notjunior-check`** puts the check request in your prompt box for you to send. **`/notjunior-notebook`** shows your notebook — open questions for your team, misconceptions you've corrected, how far the map has fallen behind `HEAD`.
- **A hand-off to the skill**: when notjunior loads, it is told which files Claude changed this session, so `own` checks exactly what was written for you.

It counts what changed during Claude's turns — through its edit tools or the shell, committed or not — and leaves out what you changed yourself between turns, and anything outside the project. It makes no network or model calls and writes nothing; it reads `.notjunior/` and runs read-only `git`. The band and pane draw in a terminal — VS Code's integrated terminal included — and in the Desktop app's Code tab. In the VS Code extension's chat panel and in headless runs nothing a mod draws appears, so the nudge comes from Claude in the conversation instead; the hold, the hand-off, and the commands' text replies work everywhere. The mod needs Claude Code 2.1.287 or later.

## What it is not

- **Not a code generator.** While it's active it explains; your normal workflow writes the code.
- **Not an interview aid.** It rehearses before and after. It declines to answer during a live interview or assessment, and never inflates what you've done.
- **Not a codebase summariser.** The understanding is meant to end up in your head, checked by you explaining it back.
- **Not a judge of your team.** Odd choices and missing practices come back as observations with a question attached — *deliberate, or not yet?* — never as verdicts.

## Install

Claude Code — the skill and the mod together:

```
/plugin marketplace add inthepond/inthepond-skills
/plugin install notjunior@inthepond-skills
```

Any agent that reads `SKILL.md` folders (Cursor, Codex, and others) — the skill only:

```
npx skills add inthepond/inthepond-skills --skill notjunior
```

## Use it

- "how does my code get to production here, and why all these steps?"
- "explain CORS properly — and show me where it matters in this repo"
- "trace what happens when a user submits a booking"
- "run an incident drill on this project"
- "Claude just wrote this diff — check I actually understand it"
- "here's a job description — what can I honestly claim?"
- `/notjunior-check` after Claude has changed things; `/notjunior-notebook` to see what you still need to ask

## The principles it holds to

1. **Evidence or a label.** Cited, or marked documented, inferred, or unknown — never inference dressed as fact.
2. **Why, cost and failure — not only what.** "Best practice" is never a reason; it says what a thing protects against.
3. **You do the understanding.** It never withholds an answer you ask for; explaining back is an invitation, not a gate.
4. **"I don't know" is a senior answer** — from it, and from you.
5. **Rehearsal, never live.** The one time it withholds an answer is during a live interview or assessment.
6. **Mistakes are the curriculum.** Wrong is named "not right", plainly and kindly, and remembered so the next session builds on it.

## Files

- [`SKILL.md`](SKILL.md) — entry point: principles, the senior questions, lens classification, workflow, guardrails
- [`references/evidence.md`](references/evidence.md) — where the *what* and the *why* live, the labels, docs-versus-code drift, reading safely
- [`references/lifecycle.md`](references/lifecycle.md), [`architecture.md`](references/architecture.md), [`stack.md`](references/stack.md), [`trace.md`](references/trace.md) — the project lenses
- [`references/incident.md`](references/incident.md) — live, drill, readiness, and post-incident review
- [`references/concepts.md`](references/concepts.md) — how to explain a concept; [`atlas.md`](references/atlas.md) — good-vs-bad contrasts across networking, APIs, security, data, resilience, delivery, operations, design, testing, and working with coding agents
- [`references/own.md`](references/own.md) — understanding a diff before you ship it
- [`references/rehearse.md`](references/rehearse.md) — check-back, rehearsal, job-description mapping, and the live-interview guardrail
- [`references/notebook.md`](references/notebook.md) — the `.notjunior/` notebook, resuming, and staleness
- [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) — the plugin manifest: the skill at the root, the mod's state contract, the `shipCheck` setting
- [`hooks/register.tsx`](hooks/register.tsx) — the mod: the band, the commit moment, the commands, the hand-off; [`notebook.ts`](hooks/notebook.ts) — its pure helpers
- [`types/index.d.ts`](types/index.d.ts) — the mod's `$.state` contract
- [`tests/notjunior.test.ts`](tests/notjunior.test.ts) — run with `claude plugin test notjunior`
- [`assets/gif-src/`](assets/gif-src/) — source and build script for the GIF above

## Rebuilding the GIF

The GIF is an illustration of a session, drawn from [`assets/gif-src/anim-body.html`](assets/gif-src/anim-body.html); the band, buttons, and toast use the mod's own strings. To rebuild it you need Google Chrome, Node 22 or later, ffmpeg, and curl:

```
sh notjunior/assets/gif-src/build.sh
```
