import { inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, catchError, filter, map, of, switchMap, takeUntil } from 'rxjs';

import { CancelOnRouteActions } from './actions';
import { CancelOnRouteApi } from './api';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export function createUnsafeLoadOrderEffect(
  actions$: Observable<Action>,
  api: Pick<CancelOnRouteApi, 'fetchOrder'>
): Observable<Action> {
  return actions$.pipe(
    ofType(CancelOnRouteActions.unsafeLoadOrder),
    switchMap(({ id }) =>
      api.fetchOrder(id).pipe(
        map((order) => CancelOnRouteActions.loadOrderSuccess({ order })),
        catchError((error: unknown) =>
          of(CancelOnRouteActions.loadOrderFailure({ id, error: errorMessage(error) }))
        )
      )
    )
  );
}

export function createRouteScopedLoadOrderEffect(
  actions$: Observable<Action>,
  routeChange$: Observable<unknown>,
  api: Pick<CancelOnRouteApi, 'fetchOrder'>
): Observable<Action> {
  return actions$.pipe(
    ofType(CancelOnRouteActions.loadOrder),
    switchMap(({ id }) =>
      api.fetchOrder(id).pipe(
        map((order) => CancelOnRouteActions.loadOrderSuccess({ order })),
        catchError((error: unknown) =>
          of(CancelOnRouteActions.loadOrderFailure({ id, error: errorMessage(error) }))
        ),
        takeUntil(routeChange$)
      )
    )
  );
}

export function createExplicitCancelLoadOrderEffect(
  actions$: Observable<Action>,
  api: Pick<CancelOnRouteApi, 'fetchOrder'>
): Observable<Action> {
  return actions$.pipe(
    ofType(CancelOnRouteActions.loadOrderWithExplicitCancel),
    switchMap(({ id }) =>
      api.fetchOrder(id).pipe(
        map((order) => CancelOnRouteActions.loadOrderSuccess({ order })),
        catchError((error: unknown) =>
          of(CancelOnRouteActions.loadOrderFailure({ id, error: errorMessage(error) }))
        ),
        takeUntil(actions$.pipe(ofType(CancelOnRouteActions.cancelLoadOrder)))
      )
    )
  );
}

const routeScopedLoadOrderEffect = createEffect(
  (actions$ = inject(Actions), router = inject(Router), api = inject(CancelOnRouteApi)) =>
    createRouteScopedLoadOrderEffect(
      actions$,
      router.events.pipe(filter((event): event is NavigationStart => event instanceof NavigationStart)),
      api
    ),
  { functional: true }
);

const explicitCancelLoadOrderEffect = createEffect(
  (actions$ = inject(Actions), api = inject(CancelOnRouteApi)) =>
    createExplicitCancelLoadOrderEffect(actions$, api),
  { functional: true }
);

export const cancelOnRouteEffects = {
  routeScopedLoadOrderEffect,
  explicitCancelLoadOrderEffect
};