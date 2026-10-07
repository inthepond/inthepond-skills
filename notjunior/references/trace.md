# Trace — how a feature actually runs

The person wants to follow one feature from the moment something triggers it to the moment it finishes — including what happens when it fails. This is the core exercise of the whole skill: a person who can trace the unhappy path of a feature can resolve the incident in it.

## Find the start

Identify the trigger: a user action, a page load, an API call, a scheduled job, a message arriving on a queue, a webhook. If the person names a feature in business terms ("submitting a booking"), map it to code:

- feature docs and plans, if they exist
- route and handler names
- the visible UI text — search for the button label or heading to find the component
- test names — tests often describe the feature in plain words

## Walk the hops

Follow the actual call path by reading code, not by guessing from names. For each hop:

- **where** — `path:line`, the function or handler
- **what it does** — one or two lines
- **data at this point** — the shape (the key fields), and how it changes: validation, mapping, enrichment
- **what can fail here, and what happens then** — thrown, caught, retried, returned as an error, or swallowed. Call out swallowed errors explicitly; they are where incidents hide.
- **what you would see** — the log line, span, metric, or user-visible message (cite the statement that emits it, or note that nothing does)

Make boundaries explicit: "here the request leaves the browser — HTTP POST to …". Mark asynchronous hops (queued, scheduled, polled, streamed) — the trace forks in time there. Note side effects — writes, emails, external calls, events emitted — and whether each is safe to repeat if the hop is retried.

Stop at a sensible depth. Framework and library internals get one line ("the framework validates the body against the schema here") unless the question lives inside them.

## Around the path

- **rules** — business rules and invariants enforced along the way (validation, permission checks, state transitions), cited. If feature docs list requirements and non-goals, map each requirement to where it is enforced; a requirement nothing enforces is a finding.
- **tests** — which tests cover this path and what they assert; which hops no test exercises
- **where bugs would hide** — races, partial failure between two writes, timezones and daylight saving, retries without idempotency, stale caches, permission checks that exist only in the UI, limits that only appear with production-sized data
- **flags and configuration** — anything that changes the path per environment

## Layout

Numbered hops; add a small Mermaid sequence diagram when the path crosses more than three boundaries.

```
**notjunior · trace: <feature>**
trigger: <what starts it> (`path:line`)

01 <component> · `path:line` — <what it does>
   data: … · fails: … → <what happens> · you'd see: …
02 …

**rules enforced** …
**covered by** … · **not covered** …
**where bugs would hide** …
**docs and code disagree**   (when they do)
```

Then close per `SKILL.md` § Close.

## Hand over

The close's check-back is a variant for the person to trace themselves — usually the unhappy path of the same feature: "Now trace what happens when the call at hop 4 times out. Where does the error go, what does the user see, and what is left half-done?" When they come back with it, check it per `rehearse.md` § check-back.
