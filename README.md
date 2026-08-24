# inthepond-skills

A small set of Claude Skills, built one at a time from a written spec. Each skill is a folder with a `SKILL.md` entry point, a `references/` directory for depth that loads on demand, and optional `assets/`.

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

### Use it

Copy `gnose/` into your skills directory (for Claude Code: `~/.claude/skills/gnose/`), then:

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
