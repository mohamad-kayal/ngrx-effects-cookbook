# 08 — Long-running tasks with progress

> A long-running task that emits incremental progress events back into the store. **The transport is simulated** — no real WebSocket server in this repo. The recipe shows where a real `WebSocketSubject` or `EventSource` would slot in.

## The problem

A "generate report" action kicks off a 30-second backend job. The user wants to see progress (`12% — querying ledger…`, `47% — formatting…`, `100% — done`). Three things have to happen:

1. The transport (WebSocket, SSE, polling) emits a stream of progress events.
2. Each event becomes an NGRX action that updates store state.
3. The stream completes (success), errors (failure), or gets cancelled (user navigated away / clicked cancel).

The official examples show step 2 in isolation. They don't show how to integrate the transport, handle cancellation, or test the whole thing without a real server.

## Simulation, not implementation

This recipe **does not** spin up a WebSocket server. Real-server code belongs in your app, not in a cookbook. Instead, an RxJS factory simulates the progress stream:

```ts
export function simulateProgress({ jobId, totalMs = 5000, steps = 10, failAtStep }: Options) {
  const stepMs = Math.floor(totalMs / steps);

  return timer(0, stepMs).pipe(
    take(steps + 1),
    map(step => {
      if (failAtStep === step) throw new Error(`Job ${jobId} failed`);
      return { jobId, progress: Math.round((step / steps) * 100) };
    })
  );
}
```

The shape of `simulateProgress` matches what `webSocket().pipe(...)` or `new EventSource(url)` would expose:

```ts
// real implementation (your app)
const progress$ = webSocket<ProgressEvent>('wss://api/jobs/123/progress');

// simulated (this recipe)
const progress$ = simulateProgress({ totalMs: 5000, steps: 10 });
```

Both are `Observable<ProgressEvent>`. Everything downstream — the effect, the reducer, the tests — is identical.

## The wrong way

```ts
startJob$ = createEffect(() =>
  this.actions$.pipe(
    ofType(startJob),
    switchMap(({ jobId }) => simulateProgress({ totalMs: 5000, steps: 10 }).pipe(
      map(event => jobProgress({ event }))
    ))
  )
);
```

## The right way

```ts
startJob$ = actions$.pipe(
  ofType(startJob),
  mergeMap(({ jobId }) => {
    const stop$ = merge(cancelJobFor(jobId), routeExit$, logout$, nextStartJob$).pipe(take(1));

    const progress$ = progressStream({ jobId }).pipe(
      mergeMap(event => event.progress === 100
        ? of(jobProgress({ event }), jobSucceeded({ jobId }))
        : of(jobProgress({ event }))
      ),
      takeUntil(stop$),
      catchError(error => of(jobFailed({ jobId, error })))
    );

    return concat(progress$, of(jobFinalized({ jobId })));
  })
);
```

## Action shape

| Action | Source | Reducer effect |
|---|---|---|
| `startJob({ jobId })` | User | `status: 'running', progress: 0` |
| `jobProgress({ event })` | Effect (per emission) | `progress: event.progress, message: event.message` |
| `jobSucceeded({ result })` | Effect (on completion) | `status: 'succeeded', progress: 100` |
| `jobFailed({ error })` | Effect (on error) | `status: 'failed', error` |
| `cancelJob({ jobId })` | User | `status: 'cancelled'` |
| `jobFinalized({ jobId })` | Effect `finalize` | (cleanup hook for derived state) |

`jobFinalized` always fires — on success, failure, or cancellation. Use it to release subscriptions, close panels, etc.

## Cancellation path

The same `takeUntil` triplet from recipe 04 (cancel action ∪ route exit ∪ logout). Cancellation closes the transport — for a real WebSocket, this is the unsubscribe call that triggers `WebSocket.close()`.

## Where the real transport plugs in

The simulation function lives at `recipes/08-long-running-progress/simulate.ts`. The effect imports it. To switch to a real transport, replace the import — nothing else changes:

```ts
// Before
import { simulateProgress as progressStream } from './simulate';

// After (your app)
import { webSocket } from 'rxjs/webSocket';
const progressStream = (jobId: string) => webSocket<ProgressEvent>(`wss://api/jobs/${jobId}/progress`);
```

## Diagram

See [diagram.md](diagram.md) — sequence diagram of the lifecycle including cancellation.

## Tests

See [effects.spec.ts](effects.spec.ts) — uses `TestScheduler` over `simulateProgress`. Asserts:

- Progress events flow through to `jobProgress` actions
- Final emission triggers `jobSucceeded`
- Mid-stream error triggers `jobFailed`, no further progress events
- `cancelJob` stops the stream and triggers `jobFinalized`
- Route change cancels the stream
- Starting a new job mid-flight cancels the old one (`switchMap` semantics)
