# ngrx-effects-cookbook

Tested, opinionated NGRX Effects recipes for the timing problems that usually show up after an app has real users: racing requests, retries, optimistic rollbacks, polling lifecycle leaks, route cancellation, cross-effect coordination, debounced input, and long-running progress streams.

[![CI](https://github.com/mohamad-kayal/ngrx-effects-cookbook/actions/workflows/ci.yml/badge.svg)](https://github.com/mohamad-kayal/ngrx-effects-cookbook/actions/workflows/ci.yml)

## Problem

The official docs teach the APIs. They do not spend much time on the production failure modes: a stale search response wins, a save is cancelled mid-flight, a retry hammers a 401, a polling stream keeps running after logout, or an optimistic rollback clobbers a newer user action.

This repo is a focused reference for those edges. It is about Effects, not NGRX basics, Entity Adapter, or Signal Store.

## What I built

- A plain Angular standalone demo app with one lazy route per recipe.
- Eight copyable recipe folders under `recipes/`, each shaped as a complete feature slice: actions, reducer, selectors, effects, mock backend, component, diagram, and tests.
- Timing-focused Jest/RxJS tests that prove the behavior under concurrency, cancellation, retry, and virtual time.
- Mermaid diagrams and decision matrices so the pattern is quick to reason about before copying code.

## Recipe index

| Recipe | Why it exists |
|---|---|
| [01 Race conditions & flattening operators](recipes/01-race-conditions/README.md) | Choose `switchMap`, `concatMap`, `mergeMap`, or `exhaustMap` by failure mode, not habit. |
| [02 Retry with exponential backoff + jitter](recipes/02-retry-backoff/README.md) | Use modern `retry({ delay })`, skip non-retryable errors, and surface retry state to the UI. |
| [03 Optimistic updates with rollback](recipes/03-optimistic-rollback/README.md) | Roll back failed optimistic changes without clobbering newer pending updates. |
| [04 Polling lifecycles](recipes/04-polling-lifecycle/README.md) | Start, stop, pause on tab visibility, back off on errors, and hard-stop on logout or route exit. |
| [05 Cancellation on route change](recipes/05-cancel-on-route/README.md) | Cancel app-scoped effects when the page that needed the request goes away. |
| [06 Cross-effect coordination](recipes/06-cross-effect-coordination/README.md) | Let effect B wait for effect A without direct effect-to-effect coupling. |
| [07 Debouncing user input to an API](recipes/07-debounce-input/README.md) | Split typing and loading states, skip duplicates, cancel empty input, and cancel stale requests. |
| [08 Long-running tasks with progress](recipes/08-long-running-progress/README.md) | Feed server-pushed progress events into the store, with cancellation and finalization. |

## Try it

```bash
npm install
npm start
```

Open `http://localhost:4200` and use the left nav to poke each recipe. The mock backends are intentionally local RxJS streams: `timer`, `of`, `throwError`, and a few fail-next toggles.

## Verify it

```bash
npm test
npm run lint
npm run build
```

The tests are the asset. Each recipe has specs covering the happy path, the failure mode the recipe addresses, and at least one timing edge case.

## How it works

The demo app uses standalone Angular providers:

- `provideStore()` and route-level `provideState(...)`
- functional effects via `createEffect(..., { functional: true })`
- route-level `provideEffects(...)`
- path aliases like `@recipes/race-conditions`

Each effect file exports pure factory functions first, then wraps them in functional effects. That keeps the production code idiomatic while making the timing tests small and direct.

## What I would do next

- Add short screen captures for each route once the GitHub repo exists.
- Add a negative-test appendix showing the wrong-way snippets failing the same specs.
- Split a follow-up repo for Signal Store patterns rather than mixing paradigms here.

## Why I built it

NGRX at scale is mostly about timing, ownership, and cancellation. These are the decisions that make an app feel boring in production, in the best possible way.