# 02 — Retry with exponential backoff + jitter

> The modern `retry({ delay, count, resetOnSuccess })` API, what's wrong with the deprecated `retryWhen` answer you'll find in older blog posts, and how to surface retry state to the UI without leaking timing concerns into your reducer.

## The problem

Most "retry on failure" examples online use `retryWhen` — which has been deprecated since RxJS 7. The replacements (`retry({ delay, count })`) are powerful but under-documented, and even the correct examples typically:

- Retry every error indiscriminately (including `401`s, which will never succeed).
- Retry with a fixed interval, causing thundering-herd problems on flaky backends.
- Hide retry state from the UI so users see a frozen spinner during a 16-second backoff cascade.

This recipe covers all three.

## The wrong way

```ts
return action$.pipe(
  ofType(load),
  switchMap(() =>
    api.fetch().pipe(
      retryWhen((errors) => errors.pipe(delay(1000)))  // ❌ retries 401, no backoff, deprecated
    )
  )
);
```

## The right way

```ts
return action$.pipe(
  ofType(load),
  switchMap(() =>
    api.fetch().pipe(
      retry({
        count: 4,
        resetOnSuccess: true,
        delay: (error, attempt) => {
          if (!isRetryableError(error)) {
            return throwError(() => error);
          }

          const delayMs = computeBackoffDelayMs(attempt, options);
          store.dispatch(loadReportRetrying({ attempt, delayMs }));
          return timer(delayMs);
        },
      }),
      map(report => loadReportSuccess({ report })),
      catchError(error => of(loadReportFailure({ error })))
    )
  )
);
```

## Backoff formula

Exponential with full jitter:

```
delay(attempt) = random(0, base * 2^attempt)
```

Capped at a max delay (e.g. 30s). Full jitter beats half-jitter for our purposes — it's simpler and the AWS Architecture Blog data shows it's at least as good.

## Don't retry these

| Status | Retry? | Why |
|---|---|---|
| `401` / `403` | No | Auth failure won't fix itself |
| `400` / `404` / `422` | No | Client error, retry won't change the response |
| `408` / `429` / `5xx` | Yes | Transient, retry with backoff |
| Network error (no response) | Yes | Most likely transient |

The `delay` function returns `throwError(err)` for non-retryable errors, which short-circuits the retry chain.

## Surfacing retry state to the UI

The reducer should not know about RxJS timing. The effect emits side-effect actions:

```ts
store.dispatch(loadReportRetrying({ attempt, delayMs }));

on(loadReportRetrying, (state, { attempt, delayMs }) => ({
  ...state,
  status: 'retrying',
  attempt,
  delayMs,
}));
```

## Diagram

See [diagram.md](diagram.md) — sequence diagram of a 3-attempt cascade with state transitions.

## Tests

See [effects.spec.ts](effects.spec.ts) — jest-marbles with virtual time, asserting:

- 5xx fails → retried with growing delays
- 401 fails → not retried, error surfaced immediately
- Success after 2 retries → resets the attempt counter
- Cap reached → final error surfaced
