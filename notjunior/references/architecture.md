# Architecture — what the pieces are, and why it is this shape

The person wants to see the system whole: what gets deployed, what stores data, how the pieces talk, where trust and failure stop — and why someone chose this shape over the obvious alternative.

## Gather

From `evidence.md`, specifically:

- **deployables** — Dockerfiles, infrastructure resources, service and package directories, workspace definitions
- **datastores** — databases, caches, object storage, search indexes, queues
- **external systems** — SDK clients, base URLs in config, API specs for things the project calls
- **communication** — HTTP clients, RPC, queues and events, websockets or server-sent events, scheduled triggers
- **trust** — where authentication is verified, where permissions are checked, which identity each service runs as
- **network** — ingress settings, private networking, gateways, load balancers, egress paths
- **docs and diagrams** — verified against code before use

## Three zooms

1. **The system in one box** — who uses it (people and other systems) and what external systems it depends on. One short paragraph and a small diagram.
2. **The deployables** — each thing that is deployed or stores data: what it is, what runs it, what it owns. Then every arrow between them: protocol, synchronous or asynchronous, who authenticates to whom, and what happens when the callee is down.
3. **Inside one** — the component the person works in: its layers or modules, the direction dependencies point, where business rules live, where input/output happens.

Default to zooms one and two, plus zoom three for the component the person names. Do not zoom into everything. On a system with many deployables, group them by layer or kind and describe the arrows between groups, noting the exceptions; list every service only when asked.

Diagrams are small, in Mermaid or plain text. Every box is something you can cite; a box you cannot cite says "(inferred)" in its text. An arrow's mode can be synchronous, asynchronous, or streamed.

## Why this shape

For the shape as a whole and for each major boundary:

- **forces** — what pushes the shape: team size and structure (systems tend to mirror the organisations that build them), compliance and data residency, latency, cost, existing systems, the platform the organisation already runs, the skills on the team
- **favours** — which qualities the shape serves: availability, security, scalability, cost, operability, ease of change, speed to market
- **trades away** — which qualities it gives up, and what that costs day to day: more things to deploy, extra network hops, consistency gaps, harder local development
- **the alternative not taken** — name the obvious one (one deployable or several, synchronous calls or a queue, relational or document store, functions or containers, the browser calling services directly or through its own backend) and say why this project did not choose it — documented, inferred, or unknown

## Boundaries juniors miss

- **trust** — who may call this, how they prove who they are, and where permission is actually enforced. A UI hiding a button is not the server refusing the action.
- **network** — what is reachable from the internet and what is private; how traffic gets out; which source address partners see
- **data ownership** — which component is the source of truth for each entity, who may write it, where copies and caches live, and how they go stale
- **failure** — if this piece is down, what still works? That is the blast radius
- **layering rules** — dependency directions or import restrictions the project enforces, and the problem each rule prevents

## Layout

```
**notjunior · architecture**

**01 — the system in one box**
<paragraph> + <small diagram>

**02 — the deployables**
| piece | what it is | runs on | owns | cite |
arrows:
<a> → <b> — <protocol>, <sync | async | streamed>, auth: <how>; if <b> is down: <what happens>

**03 — inside <component>**   (when asked)

**why this shape**
forces: … · favours: … · trades away: … · the alternative not taken: …   (each why labelled)

**boundaries**
trust: … · network: … · data ownership: … · blast radius: …

**docs and code disagree**   (when they do, and it bears on the question)
```

Then close per `SKILL.md` § Close.

## Check-back prompts

Pick one for the close and adapt it to this project:

- "If <datastore> went read-only for ten minutes, what would users notice, and in which order?"
- "Why does <caller> reach <service> through <intermediary> instead of directly?"
- "Which component is the source of truth for <entity>? What happens if two of them disagree?"
