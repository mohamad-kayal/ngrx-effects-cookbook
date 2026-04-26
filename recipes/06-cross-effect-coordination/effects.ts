import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Action, Store } from '@ngrx/store';
import { Observable, catchError, filter, map, of, switchMap, take } from 'rxjs';

import { CoordinationActions, CoordinationPattern, CurrentUser } from './actions';
import { CoordinationApi } from './api';
import { selectCurrentUser } from './selectors';

type CurrentUserStore = {
  select: (selector: unknown) => Observable<CurrentUser | null>;
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

const isUser = (user: CurrentUser | null): user is CurrentUser => user !== null;

function dashboardActions(
  api: Pick<CoordinationApi, 'loadDashboard'>,
  user: CurrentUser,
  pattern: CoordinationPattern
): Observable<Action> {
  return api.loadDashboard(user.tenantId, pattern).pipe(
    map((dashboard) => CoordinationActions.loadDashboardSuccess({ dashboard })),
    catchError((error: unknown) =>
      of(CoordinationActions.loadDashboardFailure({ pattern, error: errorMessage(error) }))
    )
  );
}

export function createLoadCurrentUserEffect(
  actions$: Observable<Action>,
  api: Pick<CoordinationApi, 'loadCurrentUser'>
): Observable<Action> {
  return actions$.pipe(
    ofType(CoordinationActions.loadCurrentUser),
    switchMap(() =>
      api.loadCurrentUser().pipe(
        map((user) => CoordinationActions.loadCurrentUserSuccess({ user })),
        catchError((error: unknown) =>
          of(CoordinationActions.loadCurrentUserFailure({ error: errorMessage(error) }))
        )
      )
    )
  );
}

export function createCoordinationActionDashboardEffect(
  actions$: Observable<Action>,
  api: Pick<CoordinationApi, 'loadDashboard'>
): Observable<Action> {
  return actions$.pipe(
    ofType(CoordinationActions.loadCurrentUserSuccess),
    switchMap(({ user }) => dashboardActions(api, user, 'coordination-action'))
  );
}

export function createRoutePivotDashboardEffect(
  actions$: Observable<Action>,
  store: CurrentUserStore,
  api: Pick<CoordinationApi, 'loadDashboard'>
): Observable<Action> {
  return actions$.pipe(
    ofType(CoordinationActions.dashboardRouteEntered),
    concatLatestFrom(() => store.select(selectCurrentUser)),
    filter(([, user]) => isUser(user)),
    switchMap(([, user]) => dashboardActions(api, user as CurrentUser, 'route-pivot'))
  );
}

export function createReadySelectorDashboardEffect(
  actions$: Observable<Action>,
  store: CurrentUserStore,
  api: Pick<CoordinationApi, 'loadDashboard'>
): Observable<Action> {
  return actions$.pipe(
    ofType(CoordinationActions.dashboardRequested),
    switchMap(() =>
      store.select(selectCurrentUser).pipe(
        filter(isUser),
        take(1),
        switchMap((user) => dashboardActions(api, user, 'ready-selector'))
      )
    )
  );
}

const loadCurrentUserEffect = createEffect(
  (actions$ = inject(Actions), api = inject(CoordinationApi)) =>
    createLoadCurrentUserEffect(actions$, api),
  { functional: true }
);

const coordinationActionDashboardEffect = createEffect(
  (actions$ = inject(Actions), api = inject(CoordinationApi)) =>
    createCoordinationActionDashboardEffect(actions$, api),
  { functional: true }
);

const routePivotDashboardEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), api = inject(CoordinationApi)) =>
    createRoutePivotDashboardEffect(actions$, store as CurrentUserStore, api),
  { functional: true }
);

const readySelectorDashboardEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store), api = inject(CoordinationApi)) =>
    createReadySelectorDashboardEffect(actions$, store as CurrentUserStore, api),
  { functional: true }
);

export const coordinationEffects = {
  loadCurrentUserEffect,
  coordinationActionDashboardEffect,
  routePivotDashboardEffect,
  readySelectorDashboardEffect
};