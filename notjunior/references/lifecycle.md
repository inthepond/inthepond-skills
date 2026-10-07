# Lifecycle — how a change gets to production

The person wants the journey of a line of code from idea to running in production, and why each step on the way exists. Most juniors experience the pipeline as a series of obstacles; the point of this lens is that every gate is a scar from a failure someone once had.

## First, what "production" means here

Say it before walking any stages: a running service, a published package, a plugin or app-store listing, a static site, a mobile release. Then say where the live copy comes from and what is live versus local (`evidence.md` § What is live, and what is local). For a distribution repository, "deploy" may be a push and "release" a version bump; name them as they are.

A **narrow question** ("when does a migration actually get applied?") gets the journey of that kind of change only — the stages it actually touches.

## Gather

From `evidence.md`, specifically:

- delivery configs — every pipeline, its triggers, jobs, and environments — read from the branches that deploy
- branch and merge conventions — `CONTRIBUTING`, agent instruction files, PR templates, `CODEOWNERS`
- commit conventions — commit linting, hooks, or only the pattern in history
- release tooling — changesets, semantic-release, tags (`git tag --sort=-creatordate | head -20`), version fields, release notes
- environment definitions — per-environment variable files, deploy job names, environment protection
- the start path — what runs when a new version boots
- feature flags — how they are defined, read, and rolled out

Read history for what actually happens, not only what is written: the commit-message pattern over the last ~200 commits, merge commits versus squashes, tag cadence. Repository settings that live outside the files (branch protection, required reviews, environment reviewers, merge queues) can be read with a read-only code-host query where the person is signed in; otherwise infer them from docs and history, labelled, or ask.

## The stages

Walk them in order. Skip what the project does not have — name it under *not here* — and renumber.

1. **Work arrives** — tickets, and how work links to code (ticket keys in branches, PR titles, commits)
2. **Branch** — the model (trunk-based, short-lived feature branches, environment branches, release branches), naming, rebase or merge policy
3. **Local loop** — how to run, test, lint, and type-check locally; pre-commit hooks; hooks that run after an agent edits
4. **Commit** — conventions, and why they matter: changelogs, and the person reading `git blame` in two years
5. **Pull request** — template, review etiquette, required reviewers, code ownership
6. **Continuous integration** — each job: what it checks and what it would catch
7. **Merge** — strategy, merge queue
8. **Build and artefact** — what is built, how it is tagged, where it is stored; build once and promote, or rebuild per environment
9. **Environments** — shown as the ladder (below), not repeated here
10. **Release** — versioning, release notes, approvals
11. **Deploy** — strategy (rolling, blue/green, canary, all at once), what runs at boot, migration ordering, flag rollout order
12. **After** — watching the release, rolling back, how a hotfix travels the ladder

## For each stage, say what applies

- **what happens** — cited
- **prevents** — the specific bad outcome the step stops, not "best practice". The shape of a good answer:
  - a merge queue prevents two individually green PRs from combining into a red main branch
  - promoting the same built artefact through every environment prevents "it passed in staging" from describing a different binary
  - requiring a reviewed, saved infrastructure plan before production applies prevents changes nobody looked at
  - least-privilege pipeline permissions limit what a compromised dependency inside the pipeline can do
  - handing branch and tag names to scripts through environment variables, instead of pasting them into the script body, stops a maliciously named branch from executing
- **costs** — minutes, friction, the workaround people are tempted into
- **when red** — how to read the failure, where the full logs are, who to ask
- **the label** on the *why*

Use only the fields that apply. A step that isn't a gate gets `gate: none` with what it buys and gives up. Add `consequence:` or `does not catch:` where that is the point. Never invent a failure to fill `prevents:`.

## Not here

Name what is absent, as observations, choosing the absences that matter for a project of this kind and size: no rollback path, no staging rung, no required review, no tests in CI, no automated dependency updates, no secret scanning, no release notes, manual deploys.

For each: what it would protect against, and the question — *deliberate, or not yet?* Many absences are reasonable trade-offs (a small team, an early product, a control that lives elsewhere); say so when the evidence suggests it. Never present an absence as negligence.

On a sparse project — no CI, one maintainer — one line says so and replaces the generic comparison; then name at most three absences that matter for this project's shape. Do not list every practice that could exist.

## Layout

```
**notjunior · lifecycle**

<short answer: what production is here, and the path to it in two or three sentences>

**the journey of a change**
01 <stage> — <what happens> (`path:line`)
   prevents: <failure> [documented | inferred | unknown]
   costs: <…> · when red: <how to read it, who to ask>
02 …

**the environment ladder**
| environment | deployed when | gate |

**docs and code disagree**   (when they do)

**not here**
- <absence> — would protect against <failure>. Deliberate, or not yet?
```

A ladder with one or two rungs can be one line. Then close per `SKILL.md` § Close.

## Check-back prompts

Pick one for the close and adapt it to what exists in this project:

- "Your PR is green, but the deploy to the next environment fails. Where do you look first, and in what order?"
- "Why can't you push straight to the main branch here — what would go wrong, specifically?"
- "Something broke in production an hour after release. What are your options, and which is fastest?"
