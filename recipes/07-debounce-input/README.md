# 07 — Debouncing user input → API

> `debounceTime + switchMap` is the right shape; the trap is what you do *between* debounces while the user is still typing.

## The problem

A search box dispatches an action on every keystroke. The naive effect makes one API call per keystroke. The slightly less naive answer (`debounceTime(300)`) fixes the volume but introduces three new problems:

1. **No loading state during the debounce window** — user sees nothing for 300ms after they stop typing, then suddenly a spinner. Feels unresponsive.
2. **Duplicate request on no-change** — user types "abc", deletes "c", types "c" again. Same query, fresh round-trip.
3. **Empty input still fires** — user clears the box, the empty-string query sails off to the API.

This recipe handles all three.

## The wrong way

```ts
search$ = createEffect(() =>
  this.actions$.pipe(
    ofType(searchInput),
    debounceTime(300),
    switchMap(({ query }) => this.api.search(query).pipe(
      map(results => searchSuccess({ results }))
    ))
  )
);
```

## The right way

```ts
typing$ = actions$.pipe(
  ofType(searchInput),
  map(({ query }) => searchTyping({ query }))
);

search$ = actions$.pipe(
  ofType(searchInput),
  switchMap(({ query }) => timer(300).pipe(
    map(() => query.trim()),
    switchMap(normalized => {
      if (!normalized) return of(searchCleared());
      if (normalized === lastIssuedQuery) return EMPTY;

      lastIssuedQuery = normalized;
      return concat(
        of(searchLoading({ query: normalized })),
        api.search(normalized).pipe(map(results => searchSuccess({ query: normalized, results })))
      );
    })
  ))
);
```

## State machine

```
idle ──[searchInput]──► typing
typing ──[searchInput]──► typing (debounce resets)
typing ──[300ms quiet, non-empty, new query]──► loading
typing ──[300ms quiet, empty]──► idle
typing ──[300ms quiet, same query as last result]──► resolved (skipped)
loading ──[success]──► resolved
loading ──[error]──► error
loading ──[searchInput]──► typing (cancels in-flight via switchMap)
```

The reducer maps to a `status: 'idle' | 'typing' | 'loading' | 'resolved' | 'error'` field. Components render different UI per status.

## Why two layers (typing → loading)

A common mistake is to set `status: 'loading'` on the keystroke action. Then the spinner flickers on every keystroke. Splitting into `typing` (immediate) and `loading` (after the debounce, only if a request actually fires) gives the UI two distinct states to render — usually a subtle "typing" indicator and a more prominent spinner.

## `distinctUntilKeyChanged` placement

It goes **after** `debounceTime`, not before. Before the debounce, every keystroke is distinct (`'a'`, `'ab'`, `'abc'` are all different). After the debounce, comparing against the last *resolved* query catches the "type c, delete c, type c" case.

## Empty input

Treat empty as a sentinel — short-circuit to `searchCleared` instead of hitting the API. The reducer maps `searchCleared` to `status: 'idle', results: []`.

## Diagram

See [diagram.md](diagram.md) — marble diagram showing keystrokes, debounce window, distinct filtering, and the resulting API calls.

## Tests

See [effects.spec.ts](effects.spec.ts) — jest-marbles tests for:

- Single keystroke + 300ms quiet → one API call
- Three rapid keystrokes within 300ms → one API call (last query)
- Same query typed twice → second one short-circuits
- Empty input → `searchCleared`, no API call
- Mid-flight new keystroke → previous request cancelled, new one fires
