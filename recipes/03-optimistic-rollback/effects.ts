import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, catchError, map, mergeMap, of } from 'rxjs';

import { OptimisticRollbackActions } from './actions';
import { OptimisticRollbackApi } from './api';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export function createToggleFlagEffect(
  actions$: Observable<Action>,
  api: Pick<OptimisticRollbackApi, 'updateFlag'>
): Observable<Action> {
  return actions$.pipe(
    ofType(OptimisticRollbackActions.toggleFlagOptimistic),
    mergeMap(({ id, enabled, correlationId }) =>
      api.updateFlag(id, enabled, correlationId).pipe(
        map(() => OptimisticRollbackActions.toggleFlagSuccess({ id, enabled, correlationId })),
        catchError((error: unknown) =>
          of(
            OptimisticRollbackActions.toggleFlagFailure({
              id,
              correlationId,
              error: errorMessage(error)
            })
          )
        )
      )
    )
  );
}

const toggleFlagEffect = createEffect(
  (actions$ = inject(Actions), api = inject(OptimisticRollbackApi)) =>
    createToggleFlagEffect(actions$, api),
  { functional: true }
);

export const optimisticRollbackEffects = {
  toggleFlagEffect
};