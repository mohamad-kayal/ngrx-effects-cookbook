import { TestScheduler } from 'rxjs/testing';

import { RaceConditionsActions } from './actions';
import {
  createSaveDraftEffect,
  createSearchUsersEffect,
  createSubmitPaymentEffect
} from './effects';

describe('race conditions effects', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('uses switchMap so stale search responses are cancelled', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a-b----', {
        a: RaceConditionsActions.searchUsers({ query: 'al' }),
        b: RaceConditionsActions.searchUsers({ query: 'alex' })
      });
      const api = {
        searchUsers: jest.fn((query: string) =>
          query === 'al'
            ? cold('---x|', { x: [{ id: 'old', name: 'Old result' }] })
            : cold('-x|', { x: [{ id: 'new', name: 'New result' }] })
        )
      };

      expectObservable(createSearchUsersEffect(actions$, api)).toBe('---s---', {
        s: RaceConditionsActions.searchUsersSuccess({
          query: 'alex',
          results: [{ id: 'new', name: 'New result' }]
        })
      });
    });
  });

  it('uses concatMap so draft writes resolve in issued order', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a-b----', {
        a: RaceConditionsActions.saveDraft({ content: 'first' }),
        b: RaceConditionsActions.saveDraft({ content: 'second' })
      });
      const api = {
        saveDraft: jest.fn((content: string) =>
          cold('--x|', { x: { version: content === 'first' ? 1 : 2, content } })
        )
      };

      expectObservable(createSaveDraftEffect(actions$, api)).toBe('--s--t-', {
        s: RaceConditionsActions.saveDraftSuccess({ receipt: { version: 1, content: 'first' } }),
        t: RaceConditionsActions.saveDraftSuccess({ receipt: { version: 2, content: 'second' } })
      });
    });
  });

  it('uses exhaustMap so duplicate submits are ignored while one is in flight', () => {
    scheduler.run(({ hot, cold, expectObservable, flush }) => {
      const actions$ = hot('a-b----', {
        a: RaceConditionsActions.submitPayment({ amount: 42 }),
        b: RaceConditionsActions.submitPayment({ amount: 42 })
      });
      const api = {
        submitPayment: jest.fn(() => cold('---x|', { x: 'pay_42' }))
      };

      expectObservable(createSubmitPaymentEffect(actions$, api)).toBe('---s---', {
        s: RaceConditionsActions.submitPaymentSuccess({ confirmation: 'pay_42' })
      });
      flush();
      expect(api.submitPayment).toHaveBeenCalledTimes(1);
    });
  });
});