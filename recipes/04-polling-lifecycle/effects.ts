import { inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import {
  EMPTY,
  Observable,
  SchedulerLike,
  asyncScheduler,
  catchError,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  merge,
  of,
  retry,
  switchMap,
  take,
  takeUntil,
  timer
} from 'rxjs';

import { PollingLifecycleActions } from './actions';
import { PollingLifecycleApi } from './api';
import { PollingVisibility, PollingVisibilitySource } from './visibility';

export interface PollingOptions {
  intervalMs: number;
  retryCount: number;
  retryDelayMs: number;
  scheduler: SchedulerLike;
}

export const defaultPollingOptions: PollingOptions = {
  intervalMs: 3_000,
  retryCount: 2,
  retryDelayMs: 800,
  scheduler: asyncScheduler
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export function createPollingLifecycleEffect(
  actions$: Observable<Action>,
  visibility$: Observable<PollingVisibility>,
  routeExit$: Observable<unknown>,
  api: Pick<PollingLifecycleApi, 'fetchStatus'>,
  options: Partial<PollingOptions> = {}
): Observable<Action> {
  const pollingOptions = { ...defaultPollingOptions, ...options };

  return actions$.pipe(
    ofType(PollingLifecycleActions.startPolling),
    switchMap(() => {
      const stop$ = merge(
        actions$.pipe(ofType(PollingLifecycleActions.stopPolling, PollingLifecycleActions.logout)),
        routeExit$
      ).pipe(take(1));

      return visibility$.pipe(
        distinctUntilChanged(),
        switchMap((visibility) =>
          visibility === 'visible'
            ? timer(0, pollingOptions.intervalMs, pollingOptions.scheduler).pipe(
                exhaustMap(() =>
                  api.fetchStatus().pipe(
                    retry({
                      count: pollingOptions.retryCount,
                      delay: () => timer(pollingOptions.retryDelayMs, pollingOptions.scheduler)
                    }),
                    map((sample) => PollingLifecycleActions.pollSuccess({ sample }))
                  )
                )
              )
            : EMPTY
        ),
        takeUntil(stop$),
        catchError((error: unknown) =>
          of(
            PollingLifecycleActions.pollFailure({ error: errorMessage(error) }),
            PollingLifecycleActions.pollingStopped({ reason: 'error' })
          )
        )
      );
    })
  );
}

const pollingEffect = createEffect(
  (
    actions$ = inject(Actions),
    visibilitySource = inject(PollingVisibilitySource),
    router = inject(Router),
    api = inject(PollingLifecycleApi)
  ) =>
    createPollingLifecycleEffect(
      actions$,
      visibilitySource.state$,
      router.events.pipe(filter((event): event is NavigationStart => event instanceof NavigationStart)),
      api
    ),
  { functional: true }
);

export const pollingLifecycleEffects = {
  pollingEffect
};