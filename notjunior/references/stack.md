# Stack — what each technology is for, and why it is here

The person wants to know what a technology is, what job it does in *this* project, and why it was chosen over the alternatives. Juniors often learn a tool's API without learning what problem it solves — so they cannot tell when it is the wrong tool.

## Gather

- manifests and lockfiles
- runtime version files (`.nvmrc`, `.python-version`, `.tool-versions`, toolchain files) and container base images
- infrastructure providers and resources — managed services are part of the stack
- tooling configs — lint, format, type-check, test runners, bundlers

## Select

Do not explain every dependency. Pick the technologies that shape the system — usually five to twelve: language and runtime, frameworks, datastores, messaging, cloud services, identity provider, observability, build and deploy tooling, test tooling. Group them by layer. List the rest in one line and offer depth on any of them.

If the person asked about one technology, cover that one and stop: the compact entry below as a header, then **how it works here** — the core ideas a person needs to use it, shown in this project's own code (borrow the layers of `concepts.md`, one to four) — and **when you copy a usage, decide these yourself**: the lines in a typical usage that are deliberate decisions disguised as boilerplate, and the question each one answers. People mostly learn a library by copying the nearest example; this is where that habit goes wrong. Drop *also present*.

## Per technology

- **job here** — one line on what it does in this project, cited at a usage site, not only the manifest
- **version** — the lockfile's resolved version, not the manifest's range
- **category and alternatives** — what kind of thing it is, and two or three common alternatives
- **why it is here** — documented, inferred, or unknown. Common inferred reasons: it fits the platform the organisation already runs, team familiarity, a specific capability the project uses (cite where), its ecosystem, the operational work a managed service removes. Be honest when the likeliest answer is "it was the default when the project started".
- **cost** — learning curve, lock-in, operational burden, licence or price, performance characteristics
- **sharp edges** — what people trip over with it, preferably where the project already guards against one (cite the guard: a pinned version, a wrapper, a warning comment). Include version traps: online examples written for an older major version.
- **learn first** — the smallest set of ideas needed to work with it in this project, and what can safely wait

## Versions and pinning

Explain what is pinned and why it matters:

- lockfiles and frozen installs make builds reproducible; without them, two builds of the same commit can differ
- runtime version files keep everyone on the same language version; long-term-support lines trade new features for stability
- a base image pinned by digest cannot change underneath you; a tag can — pinning needs an update process alongside it, or it slowly goes stale and insecure

Versions that disagree across files (a README, a toolchain file, a Dockerfile) are drift — see `evidence.md`.

## Layout

```
**notjunior · stack**

**<layer>**
**<technology>** <version> — <job here> (`path:line`)
  instead of: <alternatives> · why here: <reason> [label]
  costs: … · sharp edge: … · learn first: …

**also present:** <a>, <b>, <c> — ask about any
```

Then close per `SKILL.md` § Close.

## Check-back prompts

Pick one for the close and adapt it to this project:

- "If we replaced <technology> with <alternative>, what would get easier, and what would break first?"
- "What problem would we have if <technology> weren't here at all?"
