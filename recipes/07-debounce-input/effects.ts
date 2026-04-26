import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import {
  EMPTY,
  Observable,
  SchedulerLike,
  asyncScheduler,
  catchError,
  concat,
  map,
  of,
  switchMap,
  timer
} from 'rxjs';

import { DebounceInputActions } from './actions';
import { DebounceInputApi } from './api';

export interface DebounceOptions {
  debounceMs: number;
  scheduler: SchedulerLike;
}

export const defaultDebounceOptions: DebounceOptions = {
  debounceMs: 300,
  scheduler: asyncScheduler
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export function createTypingIndicatorEffect(actions$: Observable<Action>): Observable<Action> {
  return actions$.pipe(
    ofType(DebounceInputActions.searchInput),
    map(({ query }) => DebounceInputActions.searchTyping({ query }))
  );
}

export function createDebouncedSearchEffect(
  actions$: Observable<Action>,
  api: Pick<DebounceInputApi, 'search'>,
  options: Partial<DebounceOptions> = {}
): Observable<Action> {
  const debounceOptions = { ...defaultDebounceOptions, ...options };
  let lastIssuedQuery: string | null = null;

  return actions$.pipe(
    ofType(DebounceInputActions.searchInput),
    switchMap(({ query }) =>
      timer(debounceOptions.debounceMs, debounceOptions.scheduler).pipe(
        map(() => query.trim()),
        switchMap((normalizedQuery) => {
          if (!normalizedQuery) {
            lastIssuedQuery = null;
            return of(DebounceInputActions.searchCleared());
          }

          if (normalizedQuery === lastIssuedQuery) {
            return EMPTY;
          }

          lastIssuedQuery = normalizedQuery;

          return concat(
            of(DebounceInputActions.searchLoading({ query: normalizedQuery })),
            api.search(normalizedQuery).pipe(
              map((results) => DebounceInputActions.searchSuccess({ query: normalizedQuery, results })),
              catchError((error: unknown) =>
                of(
                  DebounceInputActions.searchFailure({
                    query: normalizedQuery,
                    error: errorMessage(error)
                  })
                )
              )
            )
          );
        })
      )
    )
  );
}

const typingIndicatorEffect = createEffect(
  (actions$ = inject(Actions)) => createTypingIndicatorEffect(actions$),
  { functional: true }
);

const debouncedSearchEffect = createEffect(
  (actions$ = inject(Actions), api = inject(DebounceInputApi)) =>
    createDebouncedSearchEffect(actions$, api),
  { functional: true }
);

export const debounceInputEffects = {
  typingIndicatorEffect,
  debouncedSearchEffect
};