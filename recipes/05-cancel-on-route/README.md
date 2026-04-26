# 05 — Cancellation on route change

> Why component-scoped subscriptions don't save you when your effects are app-scoped, and the two patterns that actually work.

## The problem

A user opens `/orders/123`, an effect dispatches `loadOrderDetails`, the API takes 8 seconds. By the time the response lands, the user has navigated to `/orders/456`. Now the store is updated with the wrong order, the new screen flickers, and you've leaked a request worth of bandwidth and a server round-trip.

"Just unsubscribe in `ngOnDestroy`" doesn't fix this — the **effect** is the subscription, and the effect lives at app scope, not component scope. The component going away has no effect on the in-flight effect.

This recipe covers the two patterns that do.

## The wrong way

```ts
loadOrder$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadOrder),
    switchMap(({ id }) => this.api.fetchOrder(id).pipe(
      map(order => loadOrderSuccess({ order }))
    ))
  )
);
// ❌ no cancellation; old order arrives after navigation, contaminates new screen
```

## The right way — pattern A: `takeUntil(routerNavigationStart$)`

Cancel the in-flight request when navigation starts to anywhere new:

```ts
loadOrder$ = createEffect(() => {
  const routeChanged$ = this.router.events.pipe(
    filter((e): e is NavigationStart => e instanceof NavigationStart)
  );
  return this.actions$.pipe(
    ofType(loadOrder),
    switchMap(({ id }) =>
      this.api.fetchOrder(id).pipe(
        map(order => loadOrderSuccess({ order })),
        takeUntil(routeChanged$)
      )
    )
  );
});
```

## The right way — pattern B: cancellation action via the `Actions` stream

Dispatch an explicit `cancelLoadOrder` action and use it as the cancel signal. More verbose but more flexible:

```ts
loadOrder$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadOrderWithExplicitCancel),
    switchMap(({ id }) => this.api.fetchOrder(id).pipe(
      map(order => loadOrderSuccess({ order })),
      takeUntil(this.actions$.pipe(ofType(cancelLoadOrder)))
    ))
  )
);
```

## When to use which

| Scenario | Pattern |
|---|---|
| Page-bound load (orders, profile, dashboard) | A — route-keyed |
| User-cancellable operation (file upload, long search) | B — explicit action |
| Modal close, drawer dismiss | B — explicit action |
| Background refresh that should survive navigation | Neither — let it complete |

## Why component-scoped doesn't work

Effects are typically `provideEffects` at app scope. They're singletons. The `Actions` stream is a `Subject` shared across the app. When a component is destroyed, none of that goes away. The classic `takeUntil(this.destroy$)` pattern is for **component-scoped subscriptions in templates and lifecycle hooks**, not for effects.

If you find yourself wanting component scope for an effect, you probably want a **service with a private subject** instead — and that service can be `providedIn: 'root'` or component-scoped, your call.

## Diagram

See [diagram.md](diagram.md) — sequence showing the contamination bug, then the same flow with `takeUntil(routerNavigationStart$)` cleanly cancelling.

## Tests

See [effects.spec.ts](effects.spec.ts) — jest-marbles tests proving:

- Without cancellation: stale response contaminates the next route
- With pattern A: navigation cancels the in-flight load, no stale dispatch
- With pattern B: explicit cancel action stops the stream
