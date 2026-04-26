# 06 — Cross-effect coordination

> When effect B depends on effect A's success, without coupling them. Three patterns, ranked by how much they leak.

## The problem

`loadDashboard` cannot fire until `loadCurrentUser` has resolved — the dashboard query needs the user's tenant ID. The naive answer is to call them sequentially in the same effect: `loadCurrentUser$.pipe(switchMap(() => loadDashboard))`. That works for one consumer. It does not work when:

- Three different screens all need "after the user is loaded" behaviour
- The user load can be triggered by different actions (login, refresh, deep-link)
- Tests need to assert each effect in isolation

This recipe shows three coordination patterns, with explicit trade-offs.

## Pattern A — coordination action

Effect A dispatches a "user loaded" action. Effect B listens for it.

```ts
loadCurrentUser$ = actions$.pipe(
  ofType(loadCurrentUser),
  switchMap(() => api.loadCurrentUser().pipe(map(user => loadCurrentUserSuccess({ user }))))
);

loadDashboard$ = actions$.pipe(
  ofType(loadCurrentUserSuccess),
  switchMap(({ user }) => api.loadDashboard(user.tenantId))
);
```

**Pros:** Decoupled. Each effect tested independently. Easy to add a third consumer (`loadNotifications`, `loadFeatureFlags`).

**Cons:** Action stream becomes the de-facto coordination mechanism. Can become noisy if every effect listens for every other effect's success.

## Pattern B — router-state pivot

Effect A sets a flag in the store (e.g., `currentUserId`). Route guards or resolvers gate the navigation that triggers Effect B until the flag is set.

```ts
canActivate() {
  return store.select(selectCurrentUser).pipe(
    filter(Boolean),
    take(1),
    map(() => true)
  );
}

loadDashboard$ = actions$.pipe(
  ofType(dashboardRouteEntered),
  concatLatestFrom(() => store.select(selectCurrentUser)),
  filter(([, user]) => Boolean(user)),
  switchMap(([, user]) => api.loadDashboard(user.tenantId))
);
```

**Pros:** Routes and data dependencies become declarative. Works well when the "ready" condition is broader than one effect.

**Cons:** Coordination logic ends up in the routing layer, which makes effects' dependencies less visible from the effect file itself.

## Pattern C — `concatLatestFrom` against a "ready" selector

Effect B reads from the store and only proceeds when the prerequisite is present:

```ts
loadDashboard$ = actions$.pipe(
  ofType(dashboardRequested),
  switchMap(() => store.select(selectCurrentUser).pipe(
    filter(Boolean),
    take(1),
    switchMap(user => api.loadDashboard(user.tenantId))
  ))
);
```

**Pros:** Effect B is self-contained — its dependencies are visible in the effect itself. No new actions needed.

**Cons:** Effect B fires its trigger before the prerequisite is ready, which means the trigger action either has to wait around or be replayed. Easy to introduce subtle timing bugs.

## Decision matrix

| Situation | Pattern |
|---|---|
| One-to-one chain (A → B) | A — coordination action |
| One-to-many fan-out (A → B, C, D) | A — coordination action |
| Coordination is route-aware | B — router pivot |
| Effect B is triggered by user action, not by A | C — concatLatestFrom |
| Effect B should re-run any time the prerequisite changes | C — concatLatestFrom |

## What to avoid

```ts
// ❌ effect that calls another effect's logic directly
loadDashboard$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadDashboard),
    switchMap(() => this.api.loadUser().pipe(  // ❌ duplicating loadCurrentUser logic
      switchMap(user => this.api.loadDashboard(user.tenantId))
    ))
  )
);
```

If you find yourself reaching for this, use Pattern A instead.

## Diagram

See [diagram.md](diagram.md) — sequence diagrams for all three patterns side by side.

## Tests

See [effects.spec.ts](effects.spec.ts) — each pattern is tested independently, asserting:

- B does not fire before A's prerequisite is met
- B fires exactly once when A succeeds
- B does not fire if A fails
