# Plan: `ngrx-effects-cookbook`

## Context

This is repo #3 in a deliberate GitHub presence strategy following `nestjs-rls-multitenant-starter` and `vin-decoder-au`. The signal we want this repo to land is *"senior Angular engineer at a real company who has actually shipped NGRX at scale"* — not a tutorial, not a "complete guide." It is a focused reference of patterns the official docs gloss over: race conditions in flattening operators, modern retry-with-backoff, optimistic updates with rollback (including the messy concurrent-update edge case), polling lifecycles, and cancellation on route change.

The asset is **tested, opinionated patterns with timing diagrams**. Tests prove the patterns work; diagrams make them comprehensible at a glance; the "when to use what" matrices show seniority. A runnable demo app lets a reader poke at each recipe in the browser, not just read code.

The reference repos already use an outcome-driven README format (problem → what I built → how it works → try it → what I'd do next → why I built it). This repo will match.

## Decisions (confirmed with user)

### Naming
Rename local folder `ngrx-cookbook` → `ngrx-effects-cookbook` to match the GitHub repo name. The longer name is more searchable on GitHub and scopes intent (this is *Effects*, not Signal Store, not Entity Adapter, not a NGRX tutorial).

### v1 recipe set — **all 8 recipes**

User-confirmed: ship everything. Numbering and intent below. Each recipe stays under ~150 LOC of implementation; the README + diagram + tests carry the depth, not the code volume.

1. **Race conditions & flattening operators** — `switchMap` vs `concatMap` vs `mergeMap` vs `exhaustMap`. Concrete failure mode per choice (cancelled-stale-response, out-of-order writes, duplicate submits). Decision matrix at the end.
2. **Retry with exponential backoff + jitter** — modern `retry({ delay, count, resetOnSuccess })`, deprecated `retryWhen` for migration context, surfacing retry state to the UI (`{ status: 'retrying', attempt: 2 }`), "don't retry 401" pattern.
3. **Optimistic updates with rollback** — apply in reducer, fire effect, on failure dispatch rollback with previous state. Headline edge case: a second optimistic update lands before the first resolves (correlation IDs + per-entity pending stacks).
4. **Polling lifecycles** — start/stop/visibility-pause/error-backoff. Page-visibility integration, hard stop on logout/route exit, why this is never just `interval()`.
5. **Cancellation on route change** — `takeUntil(routerNavigationStart$)`, the `Actions` stream pattern, why component-scoped subscriptions are not enough when effects are app-scoped.
6. **Cross-effect coordination** — when effect B depends on effect A's success without coupling them. Three patterns: coordination action, router-state pivot, and `concatLatestFrom` against a "ready" selector. Concrete use case: `loadDashboard` must wait for `loadCurrentUser` to resolve.
7. **Debouncing user input → API** — `debounceTime + switchMap`, "what about loading states between debounces" trap, distinct-by-value to avoid round-trips on no-change, empty-input cancellation.
8. **Long-running tasks with progress** — server-pushed progress events flowing back into the store. **Simulated client-side** via an RxJS factory (`interval` + `scan` + final-success/failure) — no real WebSocket server. Recipe README explicitly notes the simulation and links to where a real `WebSocketSubject` or `EventSource` would slot in.

### Repo structure

```
ngrx-effects-cookbook/
├── README.md                        # Front door + recipe index
├── LICENSE                          # MIT
├── package.json                     # workspace root
├── angular.json                     # single app + recipe libraries
├── tsconfig.base.json               # path aliases for @recipes/*
├── jest.config.ts                   # root config + jest-marbles setup
├── .eslintrc.json
├── .prettierrc
├── .github/workflows/ci.yml         # Node 20 + 22, lint + test + build
├── recipes/
│   ├── 01-race-conditions/
│   │   ├── README.md                # problem → wrong way → right way → matrix
│   │   ├── diagram.md               # Mermaid timing diagram
│   │   ├── actions.ts
│   │   ├── reducer.ts
│   │   ├── selectors.ts
│   │   ├── effects.ts
│   │   ├── effects.spec.ts          # jest-marbles
│   │   ├── component.ts             # demo sandbox UI
│   │   └── index.ts                 # public barrel
│   ├── 02-retry-backoff/
│   ├── 03-optimistic-rollback/
│   ├── 04-polling-lifecycle/
│   ├── 05-cancel-on-route/
│   ├── 06-cross-effect-coordination/
│   ├── 07-debounce-input/
│   └── 08-long-running-progress/    # simulated SSE/WebSocket via RxJS factory
└── apps/demo/                       # single Angular standalone app
    ├── src/
    │   ├── main.ts                  # bootstrapApplication + provideStore
    │   ├── app.config.ts            # provideRouter, provideEffects, provideStore
    │   ├── app.component.ts         # nav shell linking each recipe
    │   └── app.routes.ts            # one route per recipe, lazy-loaded
    └── index.html
```

**Why this shape:**
- **Single demo app, multi-route** beats per-recipe apps. One bootstrap, one nav, lower ceremony, easier to skim. Each recipe is lazy-loaded so the bundle stays honest.
- **`recipes/` as sibling to `apps/`** with TS path aliases (`@recipes/race-conditions`) — recipes are consumable by the demo without being npm packages. No `dist`, no publishing.
- **Plain Angular CLI workspace, no Nx.** Nx adds tooling weight that doesn't pay off for ~5 feature folders + 1 app. Reader can clone and `npm install` without learning Nx.
- **Each recipe is a complete NGRX feature slice** (actions/reducer/selectors/effects/spec). Reader copies the folder into their app — that is the unit of reuse.

### Demo UI shape (intentionally minimal)
- Plain HTML + minimal CSS (no Tailwind, no Material). Buttons, inputs, a `<pre>` dump of state, an action log.
- Mock backends per recipe: `of(...).pipe(delay(n))` + a "fail next request" toggle. No HTTP server.
- The point is showing the *effect* working, not designing a UI.

### Modern NGRX choices
- **Functional effects** (`createEffect(() => …, { functional: true })`) as the primary form — this is the current API. Class-based gets a brief mention in Recipe 1 only.
- **Standalone bootstrap** with `provideStore`, `provideEffects`, `provideStoreDevtools`. No NgModules.
- **Signal Store is explicitly out of scope.** One line in the root README: "This repo is about Effects. For Signal Store patterns, see [follow-up repo TBD]."

### Testing approach
- `provideMockStore` for selector/dispatch assertions.
- `jest-marbles` (`hot`/`cold`/`expectObservable`) for timing-sensitive effects (debounce, retry, polling).
- `TestScheduler` directly for the polling recipe (virtual time over `interval`).
- No component testing — recipes are about effects. The demo app's components are intentionally trivial.

## Critical files to create

| File | Purpose |
|---|---|
| `README.md` | Front door. Outcome-driven format matching prior repos. Recipe index with one-line hooks. |
| `recipes/0X-*/README.md` | Per-recipe: problem statement, "wrong way" code sample, "right way" code sample, decision matrix, link to diagram and tests. |
| `recipes/0X-*/diagram.md` | Mermaid sequence/state diagram per recipe. |
| `recipes/0X-*/effects.spec.ts` | jest-marbles tests proving the recipe behaves under timing pressure. |
| `apps/demo/src/app.routes.ts` | Lazy-loaded routes, one per recipe. |
| `.github/workflows/ci.yml` | Node 20 + 22 matrix; install, lint, test, build. |
| `tsconfig.base.json` | Path aliases for `@recipes/*`. |

No existing code to reuse — new repo.

## Implementation order

1. **Workspace skeleton** — `npm init`, Angular CLI workspace, ESLint, Prettier, Jest config, jest-marbles, tsconfig aliases, CI.
2. **Demo app shell** — standalone bootstrap, router, nav linking placeholder routes, store + effects providers.
3. **Recipe 01 (race conditions)** end-to-end — folder structure, README, diagram, code, tests, demo route. This becomes the template.
4. **Recipes 02–08** following the established template, in order. Recipe 08 last because it has the most simulation scaffolding.
5. **Root README** — written *last*, after recipes are real, so it can quote actual code and link to actual files.
6. **Polish** — badges, license, optional screenshots/GIFs of demo, `npm scripts` audit, CI green.

## Out of scope (avoid scope creep)

- NGRX basics (store, actions, reducers, selectors theory).
- Signal Store.
- Entity adapters.
- Component testing.
- Polished UI (Material, Tailwind, animations).
- Real HTTP backend / Express mock server.
- **Real WebSocket / SSE server** — Recipe 08 simulates server-pushed events client-side via an RxJS factory. The recipe README explicitly calls out where a real `WebSocketSubject` or `EventSource` would plug in.
- npm publishing.
- E2E tests (Playwright/Cypress) — unit tests are the asset.
- Husky / commit hooks.

If a recipe's implementation grows past ~150 LOC, the scope is wrong — split or simplify.

## Verification

End-to-end checks before declaring v1 done:

- `npm install` from a clean clone on Node 20 and Node 22 — no warnings about peer deps.
- `npm test` — all recipes' specs pass. Each recipe has at least 3 tests covering: happy path, failure mode the recipe addresses, edge case from the recipe's README.
- `npm run lint` — clean.
- `npm run build` — demo app builds, bundle size sane (<500KB main).
- `npm start` — demo app boots, every recipe route renders, every demo button works in a browser.
- Each recipe README's "wrong way" code sample, when pasted into the recipe's effects file, **fails** the recipe's tests. (Negative confirmation.)
- README badges all resolve. Repo URL placeholders all replaced with real `github.com/mohamad-kayal/ngrx-effects-cookbook` links.
- CI green on push.

## Decisions resolved with user

- **Recipe count:** all 8 from the brief.
- **Folder name:** rename `ngrx-cookbook` → `ngrx-effects-cookbook`.
- **Demo app shape:** single Angular standalone app with lazy-loaded routes per recipe.
- **Effects style:** functional effects (`createEffect(() => …, { functional: true })`) as the primary form. Class-based mentioned briefly in Recipe 1 only for migration context.
