# Incident — live, drill, readiness

Classify first:

| Sub-mode | Signals |
|---|---|
| `live` | something is broken now, in a real environment: "prod is down", "customers can't …", "an alert is firing", urgency, live errors pasted in. **Live always wins over teaching**, with or without a repository. |
| `drill` | the person wants to rehearse: "run a drill", "what would I do if …", "game day" |
| `readiness` | the person wants to know how this project detects, responds to, and recovers from incidents |

---

## live

Not a teaching moment. No header, no close. Short sentences, in this order:

1. **Tell someone.** If there is an on-call engineer, an incident lead, or a senior, tell them now — before debugging. Escalating early is a senior move, not a failure. Find who from on-call docs, code ownership files, or the team channel. **If nobody is reachable**: escalate anyway — call, don't only message — and post in the team channel what you're seeing; before acting alone, say in the channel what you're about to do.
2. **Stabilise before you understand.** The fastest safe mitigation usually comes before the diagnosis: roll back the last deploy, turn off the flag, scale up, fail over, disable the failing integration. Mitigation is the incident lead's decision; the person proposes it with evidence. Before proposing a rollback, check whether the release included a change that cannot be undone, such as a schema migration.
3. **What changed?** Recent deploys, config or flag changes, upstream or dependency changes, traffic shape, expiring certificates or credentials, time-based triggers (scheduled jobs, month end, daylight saving). `git log --since="6 hours ago"`, deploy history, tags against main.
4. **Blast radius.** Who is affected, how many, which environments, is data at risk?
5. **Preserve evidence.** Capture logs, error IDs, and timestamps before restarting things. Keep a timeline as you go: time, what was seen, what was done.
6. **Communicate.** A short status update at a steady interval beats silence.

How you help:

- read the code paths the errors point at (cited), and locate the logs, traces, and dashboards the project's observability setup provides
- one line on what the symptom generally points at ("a 502 means whatever sits in front of the app got no valid answer from it"), and up to three hypotheses ranked by evidence — labelled as general experience until the evidence confirms one
- ask for pasted logs with tokens and keys removed

What you do not do: run commands that change state, touch production, or suggest destructive actions as quick fixes. Destructive means deleting or overwriting data, dropping or migrating schemas, force-pushing, revoking or rotating credentials mid-incident, or restarting stateful systems before evidence is captured. Those are human decisions, made with the incident lead.

Afterwards, offer a post-incident review and a drill on the same failure: "We'll learn this properly once it's fixed."

---

## drill

A game day built from this project's actual architecture.

1. **Pick a plausible failure** grounded in a real dependency or path in this project: a datastore connection limit, an expired certificate or credential, a bad deploy, an upstream outage or rate limit, a queue backlog, a slow query after data growth, a misconfigured flag, DNS, memory exhaustion, a full disk, a time-based bug. When choosing, prefer one that:
   - starts in the person's own area and crosses one boundary
   - has a precedent in the project's history (a past incident, a fix commit, a comment describing what broke before)
   - tests the project's real detection — "no alert fires" is a legitimate and instructive drill

   Pitch the difficulty to the person's profile. Do not reveal the cause.
2. **Present symptoms the way they would really arrive** — an alert in the project's own alerting format if one exists, a user report ("the page just spins"), a description of a graph. Only what a responder would actually see at that moment. **Citations wait for the debrief**; citing the code next to a symptom gives the cause away.
3. **The person decides each step.** Reveal what each action would show: log lines, metric shapes, command output, replies from colleagues. Keep simulated output consistent with the codebase — log formats from the project's logger setup, error messages from the actual code — and mark it as simulated. Simulated people are generic roles ("a product owner", "an account manager"), never real colleagues named from history. Keep a visible simulated clock; each action costs plausible minutes. Wrong turns cost simulated time, not a lecture; let them happen, as they would in real life.
4. **Phases** they should move through: detect → triage (severity, blast radius, who to call) → mitigate → diagnose → fix → verify → communicate. Do not force the order, but notice skipped phases and raise them in the debrief.
5. **Hints**: offer one after the person has been stuck for two turns; reveal the answer when they ask.
6. **Debrief**: what they did well, specifically; where time went; the senior moves (escalating early, mitigating before diagnosing, asking what changed); and the real code and infrastructure involved, now cited. The debrief carries the close, the notebook offer in a first session, and the log entry if the notebook is on.

Drill turns have no close; the opening turn explains the rules in a few lines and ends on the call to action.

---

## readiness

How would this project know, and what would it do? For each item: present (cite), not here, or unknown.

- **detect**
  - health checks — liveness ("is the process alive?") separate from readiness ("can it serve right now?"). Mixing them restarts healthy instances or sends traffic to broken ones. A health check that calls a third party lets *their* outage restart *your* fleet.
  - error reporting, structured logs with stable event names, tracing with an ID that joins the browser to the backend, metrics
- **alert**
  - alert definitions with severity levels
  - each alert links to a runbook and a dashboard
  - each alert has a destination — one with nowhere to go goes off in silence
  - for the highest severity, a message in a busy channel is not enough; someone has to be woken
  - alerts are tested — one nobody has ever seen fire is a hope, not a control
  - alerts on symptoms users feel, not only on causes
  - absence traps — a threshold on a counter that stops being emitted never fires
- **respond** — on-call rota, escalation path, runbooks, incident roles, how status is communicated
- **recover** — a rollback path and how long it takes, flags usable as kill switches, backups with tested restores, reversible migrations, safe re-runs
- **learn** — a postmortem template, a blameless review practice, tracked action items
- **targets** — service-level indicators and objectives, error budgets

Absences follow `lifecycle.md` § Not here: what each would protect against, and *deliberate, or not yet?*

Layout:

```
**notjunior · incident readiness**
**detect**   … (`path:line`)
**alert**    …
**respond**  …
**recover**  …
**learn**    …
**targets**  …
**not here** <absence> — would protect against <failure>. Deliberate, or not yet?
```

Then close per `SKILL.md` § Close.

---

## Post-incident review

Blameless: about systems and conditions, never about people. If the person was involved, help them draft their part in their own words.

- summary and impact (who, how many, how long)
- timeline, in one consistent timezone
- detection — how it was noticed, and how quickly
- response — what was tried, what worked
- contributing factors — plural; there is rarely a single root cause. Ask "what made this possible?" and "what made it worse?"
- what went well
- action items — each with an owner, specific, and either preventing a recurrence or improving detection
