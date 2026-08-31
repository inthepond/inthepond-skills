# Inventory — what exists, so nothing is lost

The inventory is the contract both modes verify against. In `match` mode it decides what gets captured; in `overhaul` mode it is also the list of functionality that must survive. It is written to `.samesame/inventory.md` in human-readable form and confirmed by the user as part of plan approval.

## Routes

Collect the route list from the strongest source available, in this order. Stay framework-agnostic: look for the *shape* of routing, not a named framework.

1. **Router configuration in code** — route tables/arrays, URL-pattern registrations, decorators or annotations mapping paths to views, file-based routing conventions (a `pages/` or `routes/` directory tree), server-side route registrations. Grep for path-literal patterns (`'/`, `path:`, `route`) and read what you find.
2. **A crawl of the running app** — breadth-first from the root, same origin only, following `<a href>` and obvious nav controls. Record where each link was found; menus and footers reveal routes code-grepping misses (and vice versa).
3. **The user** — a pasted list, a sitemap, an analytics top-pages export. For large apps this is also how routes get *ranked*: ask which routes matter most and capture that slice first.

Deduplicate parameterized routes to one representative per pattern (`/order/:id` → one real order), and note the representative chosen — the user may know a better one (the pathological order with 40 line items).

## Per route, record

- **slug** — filesystem-safe name used for capture folders
- **path** — the URL path, with the concrete representative for parameterized routes
- **states worth capturing** — default state always; auth variants (logged out / logged in / role) when they change the UI; a filled+submitted variant for form-heavy routes. Skip loading and transient states.
- **wait condition** — a selector that signals the route has settled (defaults to `main` or the app root)
- **volatile regions** — selectors to mask at capture time (clocks, feeds, avatars, ads)

## Breakpoints and themes

Default breakpoints: `mobile 375×812`, `tablet 768×1024`, `desktop 1440×900`. The user can override; only capture what the app actually claims to support. Capture each theme (light/dark, brand variants) the original supports — a port that only matches in light mode is half-verified.

## Functional inventory (`overhaul` mode)

For each route, additionally enumerate what the UI *does*, from a DOM snapshot of the running original plus a reading of the view code:

- **controls** — buttons, links, menu items: their accessible name and what they trigger
- **forms** — fields (name, type, required-ness, validation hints), the submit target, success/failure feedback
- **displayed data** — the fields/columns actually shown, not the API's full payload
- **behaviors** — sort, filter, search, pagination, drag, inline edit, modals, keyboard shortcuts, bulk actions
- **integrations users can see** — file upload/download, print views, exports, embedded third-party widgets

Prefer harvesting from the DOM (roles, names, form attributes) because it reflects what users actually get; use the code to catch conditionally rendered items the snapshot missed. Every item gets an id (`R3-C2` — route 3, control 2) so the plan can map each one to its treatment in the new design.

This is an inventory of *presence*, not a test suite. Samesame verifies that capabilities exist and are wired (the form still posts somewhere, the sort control still exists); it does not replace end-to-end tests, and says so if the user asks it to.

## Confirmation

The inventory ends with two explicit questions carried into the plan:

- *Routes I could not reach or resolve:* … (the user fills gaps)
- *Routes/items I propose to leave out of scope:* … (the user strikes or keeps them)

Nothing is dropped from scope by default. An item the user strikes is recorded as struck by them.
