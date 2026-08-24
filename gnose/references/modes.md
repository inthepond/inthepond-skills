# Gnose — mode recipes

Read the section for the mode chosen in SKILL.md § Classify. The phrasings in quotes are tested and load-bearing; apply them as written.

## Stance (all modes)

You are an **introspection layer**. You are not answering the prompt; you are examining how it is processed. Report the *most probable* reading — the one typical training data makes most likely — not the correct one and not the flattering one. The reading you report is statistically likely, not authoritative; present it as such and let the user correct it.

Language: analyze in the input's language, and give neighbors in the input's language. Section titles stay in English. Body text follows the conversation's language.

---

## short — interpret a short utterance

Input: one utterance under ~200 characters, no output attached.

### Recipe

Produce exactly three parts.

**(a) rephrased** — "A faithful rewrite of the utterance in the way an LLM would internally most-naturally interpret it. Be specific and concrete. Make implicit assumptions explicit. This should reveal the *default reading* — the most probable interpretation given typical training data."

**(b) key_concepts** — choose **2 to 4** — "the words/phrases that carry the most ambiguity or load. Skip filler words." For each:

- `term` — the original word or phrase from the utterance, unchanged
- `interpretation` — a short clause, **under 10 words**, describing how this term is being read in this context
- `neighbors` — **8 to 10** words that occupy the same semantic neighborhood as the term **AS USED IN THIS CONTEXT** — not generic synonyms of the word in isolation. "Simple" in "simple website" neighbours `minimal`, `single-page`, `static`; it does not neighbour `easy`, `naive`, `foolish`.

**(c) alternative_readings** — **1 to 3** brief sentences, each a **"substantially different"** way the utterance could have been interpreted but probably won't be by default. Substantially different means it would lead to a different output — a paraphrase of the default reading does not qualify.

Honesty clause: "Be honest about defaults — if the utterance says 'simple website' and the most probable interpretation is 'minimalist visual design,' say that. The whole point of this tool is to show the user what the default reading is so they can correct it."

If no concept carries meaningful ambiguity: present 01, state that plainly in one line, and skip 02 and 03. Do not pad.

### Layout

```
**gnose · short utterance**

**01 — what it heard**
> you said: <original utterance, verbatim>
> it heard: *<rephrased>*

**02 — the shape of each concept**
**<term>** — read as: <interpretation>
neighbors: `w1` `w2` `w3` `w4` `w5` `w6` `w7` `w8`

**<term>** — read as: <interpretation>
neighbors: `…`

**03 — what it didn't hear**
alt 01 — <alternative reading>
alt 02 — <alternative reading>

_Corrections welcome in plain language — e.g. "in 02, 'simple' actually means easy to build". Say "reshape" when ready._

*No conclusion is offered. The differences, if any, are yours to find.*
```

Neighbors are inline code chips. Keep the numbered section titles exactly.

### Example (for shape only — do not reuse its content)

Input: `make me a simple website`

```
**gnose · short utterance**

**01 — what it heard**
> you said: make me a simple website
> it heard: *Build a small, clean, minimalist static site — most likely a single landing page with a header, a short blurb, and a contact link — in plain HTML/CSS or a lightweight framework, with an uncluttered visual design.*

**02 — the shape of each concept**
**simple** — read as: minimalist visual design, few elements
neighbors: `minimal` `clean` `uncluttered` `lightweight` `plain` `single-page` `static` `basic` `no-frills`

**website** — read as: a public-facing static site, not an app
neighbors: `landing page` `homepage` `static site` `portfolio` `brochure site` `one-pager` `web page` `HTML/CSS`

**03 — what it didn't hear**
alt 01 — "simple" meant easy to build and maintain, with no constraint on how it looks.
alt 02 — a site with real functionality (forms, accounts, payments) that merely feels simple to the visitor.

_Corrections welcome in plain language — e.g. "in 02, 'simple' actually means easy to build". Say "reshape" when ready._

*No conclusion is offered. The differences, if any, are yours to find.*
```

---

## long_predict — weigh a long prompt (no output attached)

### Chunking

Split the prompt at the chosen granularity (`paragraph` default; `sentence`; `rule`). Number chunks from 01. Keep each chunk's text verbatim, including formatting. Over ~8k words, use paragraph granularity regardless of setting and say so in one line.

### Recipe

For each chunk, predict how strongly an LLM would attend to it when executing the prompt, as one of four weights:

- `high` — strongly steers the output
- `medium` — noticeably influences the output
- `low` — present but easily overridden by other parts
- `ignored` — effectively dropped; the LLM will not behave as if this is there

Attach to each chunk a one-sentence `why`. Be honest: "long prompts often have parts that get diluted, contradict earlier parts, or feel decorative to the model." Form the `why` for every chunk during analysis, even though the chat layout shows it only on request — a `why` composed after the fact is a rationalization, not a reading.

Then produce **2 to 5 potential_divergences** — the places where author intent and default LLM reading are most likely to diverge. Each has:

- `from_prompt` — exact span from the prompt
- `default_reading` — how the LLM is likely to actually read or execute it
- `intended_reading` — what the author probably meant

"If you can't find any genuine divergence, return an empty list — do not invent one." An empty list is a complete result: present 01, say in one line that no genuine divergence was found, and stop.

### Layout

```
**gnose · long prompt — predict** (granularity: <paragraph | sentence | rule>)

**01 — what it would weigh**
█ 01 · <chunk text in full>
▓ 02 · <chunk text in full>
░ 03 · <first line of chunk>…
✕ 04 · <first line of chunk>…

█ high · ▓ medium · ░ low · ✕ ignored — ask "why <n>" for the reasoning behind any chunk's weight.

**02 — where it might diverge**
> "<from_prompt span>"
- it read this as: <default_reading>
- you probably meant: <intended_reading>

> "<from_prompt span>"
- it read this as: …
- you probably meant: …

**03 — what to do about it**
- **reshape the prompt** — edit the prompt so it reads the way you meant
- **reshape the expectation** — the reading was accurate; realign the prompt to your true goal

*No conclusion is offered. The differences, if any, are yours to find.*
```

Rules:

- `high` and `medium` chunks are quoted in full; `low` and `ignored` chunks are quoted as first line plus "…" to keep the report readable.
- Section 03 appears only when section 02 has at least one divergence.
- No percentages, no scores. The four weights are the whole scale.

---

## long_diagnose — forensic diagnosis (prompt + actual output)

Input: a prompt and an actual model output the user is unhappy with. Separate them first, preserving both verbatim.

### Recipe

Same chunking as `long_predict`, but weights are **evidence-based**, judged from the actual output. For each chunk ask: did the output reflect this chunk? Ignore it? Follow the letter but miss the spirit? Each chunk's `why` cites what in the output supports the judgment, whenever possible — a quoted phrase, a missing element, a structure that was or wasn't followed.

Then produce **2 to 6 divergences** with the same three fields as `long_predict` (`from_prompt`, `default_reading`, `intended_reading`), plus output evidence where it exists, **ordered by severity, most impactful first**.

Tone clause: "Be ruthless and specific. The user is here because something went wrong. Don't sugarcoat. If a section was ignored, say 'ignored' — don't say 'low'."

Escape clause: "If the output is actually fine and there's no real divergence, return an empty list." Present that honestly: the output followed the prompt; the mismatch may live in the user's expectation rather than the prompt. Offer the *reshape the expectation* path and stop.

### Layout

Same as `long_predict` with these changes:

```
**gnose · long prompt — diagnose** (granularity: <g>)

**01 — what it weighed**
<chunks as in predict, weights now evidence-based>

█ high · ▓ medium · ░ low · ✕ ignored — ask "why <n>" for the evidence behind any chunk's weight.

**02 — where it diverged**
> "<from_prompt span>"
- it read this as: <default_reading>
- in the output: <evidence — quote or point to the place in the output>
- you probably meant: <intended_reading>

**03 — what to do about it**
<two paths, as in predict>

*No conclusion is offered. The differences, if any, are yours to find.*
```

When the escape clause applies, section 02 is one line ("The output followed the prompt; no genuine divergence found.") followed by the expectation path only, then the closing line.

---

## Follow-ups after a report

- "why <n>" — give that chunk's one-sentence `why` (diagnose: with its evidence). Nothing else.
- A correction to a concept, alternative, chunk weight, or divergence — acknowledge in one line, record it, do not re-render the report.
- "gnose section 3 alone" — run a fresh long-mode analysis on that section only.
- "show me as a page" / "make it shareable" — render `assets/report.html` from the analysis already produced.
