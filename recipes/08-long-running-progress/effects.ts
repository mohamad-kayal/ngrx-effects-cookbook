import { inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, catchError, concat, filter, merge, mergeMap, of, take, takeUntil } from 'rxjs';

import { LongRunningProgressActions } from './actions';
import { SimulateProgressOptions, simulateProgress } from './simulate';

export type ProgressStreamFactory = (options: SimulateProgressOptions) => Observable<{
  jobId: string;
  progress: number;
  message: string;
}>;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export function createLongRunningProgressEffect(
  actions$: Observable<Action>,
  routeExit$: Observable<unknown>,
  progressStream: ProgressStreamFactory = simulateProgress
): Observable<Action> {
  return actions$.pipe(
    ofType(LongRunningProgressActions.startJob),
    mergeMap(({ jobId, failAtStep }) => {
      const stop$ = merge(
        actions$.pipe(
          ofType(LongRunningProgressActions.cancelJob),
          filter((action) => action.jobId === jobId)
        ),
        actions$.pipe(ofType(LongRunningProgressActions.logout)),
        actions$.pipe(ofType(LongRunningProgressActions.startJob)),
        routeExit$
      ).pipe(take(1));

      const progressActions$ = progressStream({ jobId, failAtStep }).pipe(
        mergeMap((event) =>
          event.progress >= 100
            ? of(
                LongRunningProgressActions.jobProgress({ event }),
                LongRunningProgressActions.jobSucceeded({
                  jobId,
                  result: { reportUrl: `/reports/${jobId}.pdf` }
                })
              )
            : of(LongRunningProgressActions.jobProgress({ event }))
        ),
        takeUntil(stop$),
        catchError((error: unknown) =>
          of(LongRunningProgressActions.jobFailed({ jobId, error: errorMessage(error) }))
        )
      );

      return concat(progressActions$, of(LongRunningProgressActions.jobFinalized({ jobId })));
    })
  );
}

const progressEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    createLongRunningProgressEffect(
      actions$,
      router.events.pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
    ),
  { functional: true }
);

export const longRunningProgressEffects = {
  progressEffect
};