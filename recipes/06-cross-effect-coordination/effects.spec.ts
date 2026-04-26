import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { CoordinationActions, CoordinationPattern, CurrentUser, DashboardSummary } from './actions';
import { CoordinationApi } from './api';
import {
  createCoordinationActionDashboardEffect,
  createLoadCurrentUserEffect,
  createReadySelectorDashboardEffect,
  createRoutePivotDashboardEffect
} from './effects';

const user: CurrentUser = { id: 'user-1', name: 'Maya', tenantId: 'tenant-acme' };

const dashboard = (pattern: CoordinationPattern): DashboardSummary => ({
  tenantId: user.tenantId,
  revenue: 100,
  openTickets: 2,
  pattern
});

describe('cross-effect coordination', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('loads the dashboard from the coordination success action', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const summary = dashboard('coordination-action');
      const actions$ = hot('a', { a: CoordinationActions.loadCurrentUserSuccess({ user }) });
      const api: Pick<CoordinationApi, 'loadDashboard'> = {
        loadDashboard: jest.fn(() => cold('--d|', { d: summary }))
      };

      expectObservable(createCoordinationActionDashboardEffect(actions$, api)).toBe('--s', {
        s: CoordinationActions.loadDashboardSuccess({ dashboard: summary })
      });
    });
  });

  it('does not coordinate dashboard loading when user loading fails', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a', { a: CoordinationActions.loadCurrentUserFailure({ error: 'Nope' }) });
      const api: Pick<CoordinationApi, 'loadDashboard'> = {
        loadDashboard: jest.fn(() => cold('--d|', { d: dashboard('coordination-action') }))
      };

      expectObservable(createCoordinationActionDashboardEffect(actions$, api)).toBe('---');
      expect(api.loadDashboard).not.toHaveBeenCalled();
    });
  });

  it('uses concatLatestFrom at the route pivot and skips when user is not ready', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a', { a: CoordinationActions.dashboardRouteEntered() });
      const currentUser$ = of(null);
      const api: Pick<CoordinationApi, 'loadDashboard'> = {
        loadDashboard: jest.fn(() => cold('-d|', { d: dashboard('route-pivot') }))
      };

      expectObservable(createRoutePivotDashboardEffect(actions$, currentUser$, api)).toBe('--');
    });
  });

  it('loads from the route pivot when the user is already ready', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const summary = dashboard('route-pivot');
      const actions$ = hot('a', { a: CoordinationActions.dashboardRouteEntered() });
      const currentUser$ = of(user);
      const api: Pick<CoordinationApi, 'loadDashboard'> = {
        loadDashboard: jest.fn(() => cold('-d|', { d: summary }))
      };

      expectObservable(createRoutePivotDashboardEffect(actions$, currentUser$, api)).toBe('-s', {
        s: CoordinationActions.loadDashboardSuccess({ dashboard: summary })
      });
    });
  });

  it('waits for the ready selector after a dashboard request', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const summary = dashboard('ready-selector');
      const actions$ = hot('a---', { a: CoordinationActions.dashboardRequested() });
      const currentUser$ = cold('--u', { u: user });
      const api: Pick<CoordinationApi, 'loadDashboard'> = {
        loadDashboard: jest.fn(() => cold('-d|', { d: summary }))
      };

      expectObservable(createReadySelectorDashboardEffect(actions$, currentUser$, api)).toBe('---s', {
        s: CoordinationActions.loadDashboardSuccess({ dashboard: summary })
      });
    });
  });

  it('keeps current-user loading independently testable', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a', { a: CoordinationActions.loadCurrentUser() });
      const api = { loadCurrentUser: jest.fn(() => cold('-u|', { u: user })) };

      expectObservable(createLoadCurrentUserEffect(actions$, api)).toBe('-s', {
        s: CoordinationActions.loadCurrentUserSuccess({ user })
      });
    });
  });
});