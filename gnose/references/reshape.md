# Gnose — reshape

Read this when the user asks to reshape ("reshape", "reshape it", "give me the reshaped prompt").

## Stance

You are a **translator**, not an optimizer. The user has told you how their words should be read; your job is to restate their words so that an LLM's default reading matches that corrected intent. Nothing about the original was deficient — it was read differently than meant, and you are translating between the two readings.

Vocabulary in anything you say around the output: "reshape," "restate," "translate." Never "fix," "improve," "optimize," "better," "stronger."

## Preconditions

1. **There must be something to reshape from.** Reshape is driven by the user's corrections, not by the findings alone. Corrections are: a changed concept reading, an adopted alternative, a changed chunk weight, a confirmed or amended divergence, or a stated goal. If the user made zero corrections and asks to reshape anyway, say there is nothing to reshape from and ask what they want changed. Do not invent corrections.
   - In long modes the divergences' `intended_reading` guesses are candidates, not corrections. If the user says "reshape" without having commented on them, ask in one line whether to adopt them as written or which to change — that is asking, not inventing.
2. **Long modes: choose the path** unless the user already made it obvious.
   - **reshape the prompt** — the prompt was ambiguous; edit it so the LLM reads it as intended.
   - **reshape the expectation** — the LLM read the prompt accurately, but the prompt does not reflect the user's true goal; rewrite it to match the goal.
   - Obvious cases: the user named a path; the user's corrections are all of the form "I meant X" (prompt); diagnose found no divergence (expectation); the user has described a goal that the prompt never stated (expectation).
   - When asking, ask once, in one or two lines, and combine it with the adopt-divergences question above if both are open.

## § short

Restate the utterance so that an LLM's default reading matches the corrected intent.

- Weave the corrections naturally into the phrasing — "don't list them as bullet points." No "with the following characteristics:", no colon-and-list structure, no labelled fields.
- "Stay close to the user's original tone and length." A casual utterance stays casual; an imperative stays imperative; first person stays first person.
- "Don't bloat short prompts into essays." A 6-word utterance becomes perhaps 8–15 words, not 60. Add only the words needed to make the corrected reading the default reading.
- Do not add requirements, constraints, formats, or roles the user did not state. Only the corrected concepts change; every other word stays as close to the original as grammar allows.
- Do not explain the changes inside or after the block.

Example (shape only): utterance `make me a simple website`, correction "simple means easy to build and maintain, I don't care how it looks":

````
```
make me a website that's easy to build and maintain — looks don't matter
```
````

## § long — reshape the prompt

This is surgery, not a rewrite. The user must be able to diff old against new and see only the intended changes.

- "Preserve the prompt's overall structure, formatting, and length." Headings, lists, code fences, numbering, blank lines, indentation — all stay. "Keep other parts verbatim."
- Change only the spans tied to a correction or an adopted divergence. Restate each such span so its default reading is the intended reading. Keep the author's register in the restated span.
- A chunk the user marked as needing more weight (e.g. "chunk 4 should be high") may be restated more plainly or moved next to the instruction it qualifies — but only that chunk, and only because the user asked. Do not touch `low` or `ignored` chunks the user did not mention.
- Do not add sections, examples, roles, or "guardrails" the original did not have. Do not remove anything the user did not ask to remove.
- If two corrected spans now contradict each other, restate them so they do not, and say so in the one line after the block.

## § long — reshape the expectation

The reading was accurate; the prompt and the goal are what differ. Rewrite the prompt so that its default reading is the user's true goal.

- The true goal must come from the user. If it has not been stated, ask for it in one line before writing anything.
- This path may change more than isolated spans, because the goal may cut across the whole prompt. Even so: keep the author's voice, format, and approximate length; keep verbatim every part that is not in tension with the goal; do not restructure for its own sake.
- Do not import content from the analysis's `default_reading` fields — those describe what was read, not what is wanted.

## Output

- The refined prompt goes in a single fenced code block with nothing else inside it. No preamble inside the block, no surrounding quotes, no language tag needed.
- If the prompt itself contains backtick fences, use a longer fence (four or more backticks) so the block copies cleanly in one action.
- After the block: at most one short line, and only when it carries information — e.g. `Changed: 02, 05.` or `Two of your corrections overlapped in chunk 03; restated as one.` Never a sentence about the result being better, clearer, or improved. Never advice.
- Nothing before the block beyond, at most, the path name in a few words (`reshape the prompt:`).
- The reshaped prompt can itself be gnosed. If the user asks, run a fresh analysis on it like any input.
