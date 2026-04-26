import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { CoordinationActions, CurrentUser } from './actions';
import {
  createCoordinationActionDashboardEffect,
  createLoadCurrentUserEffect,
  createReadySelectorDashboardEffect,
  createRoutePivotDashboardEffect
} from './effects';

const user: CurrentUser = { id: 'user-1', name: 'Maya', tenantId: 'tenant-acme' };

describe('cross-effect coordination', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('loads the dashboard from the coordination success action', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const dashboard = { tenantId: user.tenantId, revenue: 100, openTickets: 2, pattern: 'coordination-action' as const };
      const actions$ = hot('a', { a: CoordinationActions.loadCurrentUserSuccess({ user }) });
      const api = { loadDashboard: jest.fn(() => cold('--d|', { d: dashboard })) };

      expectObservable(createCoordinationActionDashboardEffect(actions$, api)).toBe('--s', {
        s: CoordinationActions.loadDashboardSuccess({ dashboard })
      });
    });
  });

  it('does not coordinate dashboard loading when user loading fails', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a', { a: CoordinationActions.loadCurrentUserFailure({ error: 'Nope' }) });
      const api = { loadDashboard: jest.fn(() => cold('--d|')) };

      expectObservable(createCoordinationActionDashboardEffect(actions$, api as any)).toBe('---');
      expect(api.loadDashboard).not.toHaveBeenCalled();
    });
  });

  it('uses concatLatestFrom at the route pivot and skips when user is not ready', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a', { a: CoordinationActions.dashboardRouteEntered() });
      const store = { select: jest.fn(() => of(null)) };
      const api = { loadDashboard: jest.fn(() => cold('-d|')) };

      expectObservable(createRoutePivotDashboardEffect(actions$, store, api as any)).toBe('--');
    });
  });

  it('loads from the route pivot when the user is already ready', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const dashboard = { tenantId: user.tenantId, revenue: 100, openTickets: 2, pattern: 'route-pivot' as const };
      const actions$ = hot('a', { a: CoordinationActions.dashboardRouteEntered() });
      const store = { select: jest.fn(() => of(user)) };
      const api = { loadDashboard: jest.fn(() => cold('-d|', { d: dashboard })) };

      expectObservable(createRoutePivotDashboardEffect(actions$, store, api)).toBe('-s', {
        s: CoordinationActions.loadDashboardSuccess({ dashboard })
      });
    });
  });

  it('waits for the ready selector after a dashboard request', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const dashboard = { tenantId: user.tenantId, revenue: 100, openTickets: 2, pattern: 'ready-selector' as const };
      const actions$ = hot('a---', { a: CoordinationActions.dashboardRequested() });
      const store = { select: jest.fn(() => cold('--u', { u: user })) };
      const api = { loadDashboard: jest.fn(() => cold('-d|', { d: dashboard })) };

      expectObservable(createReadySelectorDashboardEffect(actions$, store, api)).toBe('---s', {
        s: CoordinationActions.loadDashboardSuccess({ dashboard })
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