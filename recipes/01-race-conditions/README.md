# 01 — Race conditions & flattening operators

> The four-way decision that decides whether your effect cancels stale work, queues it, parallelises it, or ignores it — and the failure mode you ship if you pick wrong.

## The problem

Every NGRX effect that triggers an async operation has to answer: what happens when a new trigger arrives while the previous one is still in flight? RxJS gives you four flattening operators — `switchMap`, `concatMap`, `mergeMap`, `exhaustMap` — and the docs explain what each one does. They do not explain which failure mode you ship if you pick wrong.

This recipe walks through the four concrete failure modes so the decision becomes mechanical.

## Failure modes by operator

| Pick | What breaks | Real-world example |
|---|---|---|
| `switchMap` on a write | Cancelled mid-flight write — server may or may not have committed | Hitting "Save" twice quickly, second cancels first, first may have already written |
| `concatMap` on a search | UI feels frozen — every typed character queues a request behind the last | Typeahead search where each keystroke is queued instead of replacing |
| `mergeMap` on dependent writes | Out-of-order completion — last write wins is *not* the last write *issued* | Quick toggles where the older request resolves last and overwrites the newer state |
| `exhaustMap` on user-initiated retry | Retry click does nothing while previous attempt is in flight | "Try again" button appears unresponsive after a failed save |

## The wrong way

```ts
saveDraft$ = createEffect(() =>
	actions$.pipe(
		ofType(saveDraft),
		switchMap(({ content }) => api.saveDraft(content).pipe(
			map(receipt => saveDraftSuccess({ receipt }))
		))
	)
);
// Looks fine locally, but the second save cancels the first in-flight save.
```

## The right way

```ts
export const searchUsers$ = actions$.pipe(
	ofType(searchUsers),
	switchMap(({ query }) => api.searchUsers(query))
);

export const saveDraft$ = actions$.pipe(
	ofType(saveDraft),
	concatMap(({ content }) => api.saveDraft(content))
);

export const uploadAvatar$ = actions$.pipe(
	ofType(uploadAvatar),
	mergeMap(({ fileName }) => api.uploadAvatar(fileName))
);

export const submitPayment$ = actions$.pipe(
	ofType(submitPayment),
	exhaustMap(({ amount }) => api.submitPayment(amount))
);
```

## Decision matrix

| Operation type | Operator | Why |
|---|---|---|
| Read / search / typeahead | `switchMap` | Stale results are wrong results |
| Dependent writes (same entity) | `concatMap` | Order matters, data integrity > latency |
| Independent writes (different entities) | `mergeMap` | Parallelism is fine when there's no shared state |
| User-initiated submit / login | `exhaustMap` | Ignore the duplicate click, finish what you started |

## Diagram

See [diagram.md](diagram.md) — marble diagrams contrasting the four operators on the same input stream.

## Tests

See [effects.spec.ts](effects.spec.ts) — jest-marbles tests proving each operator's behaviour under the same timing input. The "wrong way" examples above, pasted into `effects.ts`, fail these tests.

## Class-based vs functional effects

This recipe shows both forms (class-based for migration context, functional as the recommended modern form). All other recipes in this repo use functional effects only.

```ts
// Class-based effect, still common in older codebases.
readonly searchUsers$ = createEffect(() =>
	this.actions$.pipe(ofType(searchUsers), switchMap(({ query }) => this.api.searchUsers(query)))
);

// Functional effect, used by the recipes in this repo.
export const searchUsers$ = createEffect(
	(actions$ = inject(Actions), api = inject(RaceConditionsApi)) =>
		actions$.pipe(ofType(searchUsers), switchMap(({ query }) => api.searchUsers(query))),
	{ functional: true }
);
```
