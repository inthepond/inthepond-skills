# Own — understand a change before you ship it

For a diff the person wrote, or a coding agent wrote for them. The rule a senior works by: if you will be on call for it, you need to be able to explain it.

## Gather

- the change: `git show <sha>` for one commit, `git diff` or `git diff --staged` for uncommitted work, `git diff <base>...HEAD` for a branch, or a pull request's diff (`gh pr diff <n>` — read-only). Code that exists only in the conversation is read from the conversation.
- the full files around each hunk, not only the hunk
- callers of anything whose signature or behaviour changed (search for them), including later commits that depend on this one
- tests touched — and tests that should have been
- configuration, migration, infrastructure, and dependency changes hiding in the diff

Comments, docstrings, and commit messages the diff adds are part of what is being checked: label them **stated in the diff** (`evidence.md` § The labels), never documented.

## Ask first

Before explaining anything, ask the person to answer briefly, in their own words — all five at once, not as an interrogation one at a time:

1. What does this change do, and why is it needed?
2. Why this way — what else could it have done?
3. What else does it touch? (callers, data, other services)
4. How could it fail, and how would you know?
5. How would you undo it?

"I don't know" to any of them is fine — that is what this lens is for; note it. If the person would rather hear your reading first, give it, then ask the questions afterwards.

## Then compare

The compare is this lens's check-back; don't also run `rehearse.md` § check-back. Read the diff yourself against their answers and report, leading with what is not right:

- **not right** — where their explanation is wrong, stated plainly with the evidence. An answer true only in a narrower case than stated belongs here, with the case where it holds ("a 502 only if the ad server drops after the lock; before it, a 409").
- **you got right** — specifically. An answer that is true but incomplete belongs here, with the rest under *the diff also*.
- **the diff also** — what the change does that they did not mention, cited to the hunk: side effects, changed defaults, new dependencies, behaviour changes for existing callers, error handling added or removed, performance (a query inside a loop, a network call while holding a lock), security (a new input path, a permission check moved or dropped)
- **the reviewer will ask** — three to five questions the person should be able to answer before raising the PR
- **at 3am** — if this breaks in production: the first symptom, the log line or metric that would show it (cited, or noted as not here), and the rollback — including whether it is clean (migrations, messages already sent, data already written in the new shape) and whether the project's delivery actually deploys a revert
- **untested** — paths the change adds that no test exercises

Keep *the diff also* and *untested* to about four items each; offer the rest. Questions only someone else can answer go to *questions for your team*, not to *the reviewer will ask*.

## Not here

- **No rewriting the code while this skill is active.** If something is wrong, say what and why; the person changes it in their normal workflow — with or without their agent — and can bring the new diff back.
- **No approval.** Never say "looks good to merge". This lens is not the reviewer; the team is.
- **No guessing who wrote which line.** Agent-written or not, the person owns all of it.

## Layout

```
**notjunior · own: <commit, branch, or one-line summary>**

**you said** <one-line summary of their answers>
**not right** …
**you got right** …
**the diff also** … (`path:line`)
**the reviewer will ask** …
**at 3am**
- symptom: …
- signal: …
- rollback: …
**untested** …
```

Then close per `SKILL.md` § Close. The check-back is a targeted retry: "Have another go at 2 and 4 with what you know now."
