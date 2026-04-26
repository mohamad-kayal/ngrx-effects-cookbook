# 04 — Polling lifecycles

> The thing that is never just `interval(5000)`. Real polling has start, stop, page-visibility pause, error backoff, and a hard stop on logout or route exit.

## The problem

`interval(5000).pipe(switchMap(() => api.fetch()))` is the answer in every NGRX intro. It's wrong in production:

- Tab in background? Still polls. Drains battery, wastes API quota.
- Network blip causes one error? The whole stream dies (or — worse — it doesn't, and you hammer the failing endpoint at full rate).
- User logs out? Polling continues against the now-unauthenticated endpoint until the page reloads.
- User navigates away from the screen that needed the data? Polling continues in memory.

This recipe builds a polling effect that handles all four.

## The wrong way

```ts
return action$.pipe(
  ofType(startPolling),
  switchMap(() => interval(5000).pipe(
    switchMap(() => api.fetch())  // ❌ polls in background, dies on first error
  ))
);
```

## The right way

```ts
return actions$.pipe(
  ofType(startPolling),
  switchMap(() => visibility$.pipe(
    distinctUntilChanged(),
    switchMap(visibility =>
      visibility === 'visible'
        ? timer(0, intervalMs).pipe(exhaustMap(() => api.fetchStatus()))
        : EMPTY
    ),
    retry({ count: 2, delay: () => timer(800) }),
    takeUntil(merge(stopPolling$, logout$, routeExit$))
  ))
);
```

## Lifecycle diagram

```
startPolling
    │
    ▼
┌───────────────────────────────────────────┐
│ interval(BASE_MS)                         │
│   │                                       │
│   ▼                                       │
│ visibility$ (running ↔ paused)            │
│   │                                       │
│   ▼                                       │
│ api.fetch() with retry({delay, count})    │
│   │                                       │
│   ▼                                       │
│ dispatch(pollSuccess | pollFailed)        │
└───────────────────────────────────────────┘
    │
    └─ takeUntil(stopPolling$ ∪ logout$ ∪ navigation away)
```

See [diagram.md](diagram.md) for the full Mermaid version.

## Page-visibility integration

Use `document.visibilityState` via a small RxJS source:

```ts
const visibility$ = fromEvent(document, 'visibilitychange').pipe(
  map(() => document.visibilityState === 'hidden' ? 'hidden' : 'visible'),
  startWith(document.visibilityState === 'hidden' ? 'hidden' : 'visible'),
  shareReplay({ bufferSize: 1, refCount: true })
);
```

When hidden, the polling stream pauses — *not* by gating fetches conditionally inside `switchMap` (which still fires the interval), but by switching to `EMPTY` while hidden. That way the timer itself stops contributing, and the next `visible` flip restarts cleanly.

## Error backoff

Reuses recipe 02's retry-with-backoff. On terminal failure (count exceeded), the polling stream emits a "polling-stopped-due-to-error" action — the UI can offer a "resume" button that re-dispatches `startPolling`.

## Hard-stop signals

| Signal | Source | Action |
|---|---|---|
| User pressed stop | `stopPolling` action | `takeUntil(actions$.pipe(ofType(stopPolling)))` |
| User logged out | `logout` action | `takeUntil(actions$.pipe(ofType(logout)))` |
| Route changed | Router events | `takeUntil(routerNavigationStart$)` |

All three combined with `merge(...).pipe(take(1))`.

## Tests

See [effects.spec.ts](effects.spec.ts) — uses `TestScheduler` directly for virtual-time control over `interval`. Asserts:

- Polls at the configured interval
- Pauses on visibility change to hidden, resumes on visible
- Backs off on error, recovers on success
- Hard-stops on `stopPolling`, `logout`, or route exit
