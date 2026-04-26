import { TestScheduler } from 'rxjs/testing';

import { CancelOnRouteActions } from './actions';
import {
  createExplicitCancelLoadOrderEffect,
  createRouteScopedLoadOrderEffect,
  createUnsafeLoadOrderEffect
} from './effects';

describe('cancel on route effects', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('shows the stale-response bug without cancellation', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const order = { id: '123', customer: 'Ada', total: 140 };
      const actions$ = hot('a----', { a: CancelOnRouteActions.unsafeLoadOrder({ id: '123' }) });
      const api = { fetchOrder: jest.fn(() => cold('---o|', { o: order })) };

      expectObservable(createUnsafeLoadOrderEffect(actions$, api)).toBe('---s-', {
        s: CancelOnRouteActions.loadOrderSuccess({ order })
      });
    });
  });

  it('cancels an in-flight request on router navigation start', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const order = { id: '123', customer: 'Ada', total: 140 };
      const actions$ = hot('a----', { a: CancelOnRouteActions.loadOrder({ id: '123' }) });
      const routeChange$ = hot('--n--', { n: 'NavigationStart' });
      const api = { fetchOrder: jest.fn(() => cold('---o|', { o: order })) };

      expectObservable(createRouteScopedLoadOrderEffect(actions$, routeChange$, api)).toBe('-----');
    });
  });

  it('cancels an in-flight request with an explicit action', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const order = { id: '123', customer: 'Ada', total: 140 };
      const actions$ = hot('a-c--', {
        a: CancelOnRouteActions.loadOrderWithExplicitCancel({ id: '123' }),
        c: CancelOnRouteActions.cancelLoadOrder()
      });
      const api = { fetchOrder: jest.fn(() => cold('---o|', { o: order })) };

      expectObservable(createExplicitCancelLoadOrderEffect(actions$, api)).toBe('-----');
    });
  });
});