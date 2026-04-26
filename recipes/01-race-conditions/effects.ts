import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, catchError, concatMap, exhaustMap, map, mergeMap, of, switchMap } from 'rxjs';

import { RaceConditionsApi } from './api';
import { RaceConditionsActions } from './actions';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export function createSearchUsersEffect(
  actions$: Observable<Action>,
  api: Pick<RaceConditionsApi, 'searchUsers'>
): Observable<Action> {
  return actions$.pipe(
    ofType(RaceConditionsActions.searchUsers),
    switchMap(({ query }) =>
      api.searchUsers(query).pipe(
        map((results) => RaceConditionsActions.searchUsersSuccess({ query, results })),
        catchError((error: unknown) =>
          of(RaceConditionsActions.searchUsersFailure({ query, error: errorMessage(error) }))
        )
      )
    )
  );
}

export function createSaveDraftEffect(
  actions$: Observable<Action>,
  api: Pick<RaceConditionsApi, 'saveDraft'>
): Observable<Action> {
  return actions$.pipe(
    ofType(RaceConditionsActions.saveDraft),
    concatMap(({ content }) =>
      api.saveDraft(content).pipe(
        map((receipt) => RaceConditionsActions.saveDraftSuccess({ receipt })),
        catchError((error: unknown) =>
          of(RaceConditionsActions.saveDraftFailure({ content, error: errorMessage(error) }))
        )
      )
    )
  );
}

export function createSubmitPaymentEffect(
  actions$: Observable<Action>,
  api: Pick<RaceConditionsApi, 'submitPayment'>
): Observable<Action> {
  return actions$.pipe(
    ofType(RaceConditionsActions.submitPayment),
    exhaustMap(({ amount }) =>
      api.submitPayment(amount).pipe(
        map((confirmation) => RaceConditionsActions.submitPaymentSuccess({ confirmation })),
        catchError((error: unknown) =>
          of(RaceConditionsActions.submitPaymentFailure({ error: errorMessage(error) }))
        )
      )
    )
  );
}

export function createUploadAvatarEffect(
  actions$: Observable<Action>,
  api: Pick<RaceConditionsApi, 'uploadAvatar'>
): Observable<Action> {
  return actions$.pipe(
    ofType(RaceConditionsActions.uploadAvatar),
    mergeMap(({ fileName }) =>
      api.uploadAvatar(fileName).pipe(
        map((receipt) => RaceConditionsActions.uploadAvatarSuccess({ receipt })),
        catchError((error: unknown) =>
          of(RaceConditionsActions.uploadAvatarFailure({ fileName, error: errorMessage(error) }))
        )
      )
    )
  );
}

const searchUsersEffect = createEffect(
  (actions$ = inject(Actions), api = inject(RaceConditionsApi)) =>
    createSearchUsersEffect(actions$, api),
  { functional: true }
);

const saveDraftEffect = createEffect(
  (actions$ = inject(Actions), api = inject(RaceConditionsApi)) => createSaveDraftEffect(actions$, api),
  { functional: true }
);

const submitPaymentEffect = createEffect(
  (actions$ = inject(Actions), api = inject(RaceConditionsApi)) =>
    createSubmitPaymentEffect(actions$, api),
  { functional: true }
);

const uploadAvatarEffect = createEffect(
  (actions$ = inject(Actions), api = inject(RaceConditionsApi)) =>
    createUploadAvatarEffect(actions$, api),
  { functional: true }
);

export const raceConditionsEffects = {
  searchUsersEffect,
  saveDraftEffect,
  submitPaymentEffect,
  uploadAvatarEffect
};