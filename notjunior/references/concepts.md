# Concepts — explaining the vague things properly

Juniors meet words like "load balancer", "idempotent", and "eventual consistency" and are handed definitions. What they lack is the judgement that experience gives: what good and bad look like, how the thing fails, what a senior checks. That judgement is what this lens supplies. `atlas.md` holds the contrasts.

## Method

Explain in layers. A first answer covers layers 1–4, one good-vs-bad contrast, and how it fails; offer the rest in the close's next-step line. A short or "just the answer" question gets layer 1 and a few lines of 3, with no layout headings.

1. **In one sentence** — plain words, no jargon the person does not have yet. Define unfamiliar terms inline as they appear; that often replaces a calibration question.
2. **Picture it** — an analogy or mental model, then *where the picture breaks*. Every analogy breaks somewhere; saying where prevents the misconception it would otherwise plant.
3. **How it works** — the mechanics, step by step. For networking, follow one request: who sends what to whom, in what order, and what each party knows.
4. **In this codebase** — where it appears, cited, and **why it is here** (labelled) and what it costs. If it does not appear, say so in one line and use a minimal example, or point to a well-known public project that shows it. With no repository, leave this layer out.
5. **Good vs bad** — two to four contrasts from `atlas.md`, or built in the same style: concrete, with why, and when the weaker version is actually fine. Find the project's own instance before using a contrast; never claim the project does something it doesn't.
6. **How it fails** — the symptoms in production: error messages, latency shapes, user reports — so the person recognises it in the wild.
7. **What a senior checks** — the questions asked about this concept in a review or a design discussion.
8. **You've got it when you can …** — two or three concrete checks: explain it to a non-engineer, predict what happens if something changes, find it in this codebase. This is the lens's check-back; it replaces the generic line in the close.

## Rules

- **Correct over simple.** Simplify by leaving things out, never by saying something false. When a simplification bends the truth, flag it: "this is roughly true; the exact version is …".
- **One concept at a time.** Name its neighbours in the close's single next-step line, together with any lens worth visiting next: "this connects to retries — or we could trace one call through the code".
- **Numbers make it real.** Typical latencies, sizes, and limits, as orders of magnitude, labelled approximate.
- **Judgement, not "it depends".** When it does depend, say on what.
- **Platform behaviour** that the explanation leans on is checked against official docs where it matters (`evidence.md` § The labels).

## Layout

```
**notjunior · concept: <name>**

**in one sentence** …
**picture it** … *(where the picture breaks: …)*
**how it works** …
**in this codebase** … (`path:line`) · why here: … [label] · costs: …
**good vs bad**
- weaker: … → stronger: … — because … (fine when: …)
**how it fails** …
**docs and code disagree**   (when they do)
**what a senior checks** …        (on request, or when short)
**you've got it when you can** …
```

Then close per `SKILL.md` § Close, with *you've got it when you can* as the check-back.
