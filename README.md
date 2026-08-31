# inthepond-skills

From [inthepond](https://inthepond.com.au/) — more novel things live there; come say hello.

A small set of Skills, built one at a time from a written spec. Each skill is a folder with a `SKILL.md` entry point, a `references/` directory for depth that loads on demand, and optional `assets/`.

## Why this exists

This skill directory is not here to make you more productive.

Most tools built on top of language models are aimed at output: more of it, faster, with less of you in the loop. The skills here point the other way. They exist to give creativity and thinking back to the person using the model — by making the model's own reading visible, by declining to draw conclusions on your behalf, and by leaving the differences for you to find.

A model is very good at supplying a default. These skills are here so the default stays yours to accept, correct, or refuse.

## gnose

An introspection layer between you and the model.

Gnose makes visible how an LLM interprets your words — the default reading, the shape of each loaded concept, the parts of a long prompt it weights or ignores — so you can correct that reading in your own language and get your prompt reshaped to what you actually meant.

![gnose: you say something, the model's default reading appears, you correct it in plain language, and the prompt is reshaped](gnose/gnose.gif)

### What it does

Three modes, chosen automatically from the input:

| Mode | Input | Output |
|---|---|---|
| **short** | one utterance | 01 what it heard · 02 the shape of each concept (with semantic neighbors) · 03 what it didn't hear |
| **long_predict** | a long prompt, SKILL, or system prompt | which parts an LLM would weigh high / medium / low / ignore, and where the reading is likely to diverge from your intent |
| **long_diagnose** | a prompt plus an output you're unhappy with | evidence-based weights and divergences, most impactful first |

After a report you correct any reading conversationally ("by *simple* I meant easy to build"), and when you say "reshape", Gnose restates your prompt so the default reading matches the corrected intent — in your voice, at your length.

### What it is not

- Not a prompt optimizer. It never judges a prompt as "bad" or teaches best practices.
- Not a linter. No rules, no scores, no percentages.
- Not a wrapper. It exposes the model's reading; it doesn't decorate it.

Every report ends the same way: *No conclusion is offered. The differences, if any, are yours to find.*

### Install

Claude Code — add this repo as a plugin marketplace, then install the skill by name:

```
/plugin marketplace add inthepond/inthepond-skills
/plugin install gnose@inthepond-skills
```

Any agent that reads `SKILL.md` folders (Claude Code, Cursor, Codex, and others) — one command, installs just this skill:

```
npx skills add inthepond/inthepond-skills --skill gnose
```

Add `-g` to install for your user rather than the current project. Or copy the `gnose/` folder into your skills directory by hand (for Claude Code: `~/.claude/skills/gnose/`).

### Use it

Then, in a conversation:

- "gnose this prompt: …"
- "how would Claude read this system prompt?"
- "why didn't it get what I meant? here's the prompt and the output …"

Ask for "a shareable version" to get the report as a page ([`gnose/assets/report.html`](gnose/assets/report.html)).

### Files

- [`gnose/SKILL.md`](gnose/SKILL.md) — entry point, principles, workflow, and the protected-phrase table that governs edits
- [`gnose/references/modes.md`](gnose/references/modes.md) — the three mode recipes and report layouts
- [`gnose/references/reshape.md`](gnose/references/reshape.md) — reshape rules (translator, not optimizer)
- [`gnose/assets/report.html`](gnose/assets/report.html) — report template for the shareable page
- [`gnose/assets/gif-src/`](gnose/assets/gif-src/) — source and build script for the GIF above

## samesame

*Same same, but different.* A harness for carrying a UI through a transition while its functionality stays fixed.

Born from a real story: a developer ports an AngularJS app to modern Angular, everything works, and the UI looks utterly different — but describing two hundred visual defects to a coding agent piece by piece costs more than porting by hand, so the agent gets abandoned. Samesame removes the human from the *find → describe → verify* loop: it builds the agent its own eyes (a local screenshot + computed-style harness over both versions), writes one plan you approve, then converges increment by increment — resumable whenever your thirty minutes are up.

### What it does

Two modes, chosen from your intent:

| Mode | You want | Ground truth | Verified by |
|---|---|---|---|
| **match** | the new stack to look like the old one (ports, upgrades) | the legacy UI, captured | pixel diffs + computed-style deltas, converged cause by cause |
| **overhaul** | a new look that loses no functionality (redesigns) | a functional inventory of every route, control, form, field | a coverage contract — every item mapped to a treatment; removals need your explicit approval |

In both modes: an itemized plan with evidence you can open, one explicit approval gate before any code changes, checkpointed increments, and a `state.json` so "continue samesame" resumes after any gap.

### What it is not

- Not a redesign oracle — direction and acceptance are yours; it never judges what looks better.
- Not a cloud service — everything is local (Playwright + pixelmatch as isolated dev-deps, with a hand-captured-screenshots fallback for locked-down machines). Nothing leaves your machine.
- Not a big-bang rewriter — no code before approval; every step small, checkpointed, revertable.

### Install

Claude Code:

```
/plugin marketplace add inthepond/inthepond-skills
/plugin install samesame@inthepond-skills
```

Any agent that reads `SKILL.md` folders:

```
npx skills add inthepond/inthepond-skills --skill samesame
```

### Use it

- "the port works but looks completely different — samesame it"
- "redesign this UI with our design system, but don't lose a single feature"
- "continue samesame" (tomorrow, or next month)

### Files

- [`samesame/SKILL.md`](samesame/SKILL.md) — entry point: principles, mode classification, workflow, edge cases
- [`samesame/references/inventory.md`](samesame/references/inventory.md) — enumerating routes, states, and the functional inventory
- [`samesame/references/harness.md`](samesame/references/harness.md) — the three capture tiers, config, auth, re-capture discipline
- [`samesame/references/match.md`](samesame/references/match.md) — cause taxonomy and the convergence loop
- [`samesame/references/overhaul.md`](samesame/references/overhaul.md) — design direction, the coverage contract, execution order
- [`samesame/references/plan-format.md`](samesame/references/plan-format.md) — plan file, approval protocol, state and resuming
- [`samesame/assets/harness/`](samesame/assets/harness/) — capture/diff/login script templates copied into each project's `.samesame/harness/`
