import { TestScheduler } from 'rxjs/testing';

import { OptimisticRollbackActions } from './actions';
import { createToggleFlagEffect } from './effects';
import { initialOptimisticRollbackState, optimisticRollbackReducer } from './reducer';

describe('optimistic rollback recipe', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('echoes the correlation ID through the success action', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a', {
        a: OptimisticRollbackActions.toggleFlagOptimistic({
          id: 'email-alerts',
          enabled: true,
          correlationId: 'change-1'
        })
      });
      const api = {
        updateFlag: jest.fn(() => cold('--x|', { x: { id: 'email-alerts', name: 'Email alerts', enabled: true } }))
      };

      expectObservable(createToggleFlagEffect(actions$, api)).toBe('--s', {
        s: OptimisticRollbackActions.toggleFlagSuccess({
          id: 'email-alerts',
          enabled: true,
          correlationId: 'change-1'
        })
      });
    });
  });

  it('keeps the second optimistic update visible when the first update fails', () => {
    const firstOptimistic = optimisticRollbackReducer(
      initialOptimisticRollbackState,
      OptimisticRollbackActions.toggleFlagOptimistic({
        id: 'email-alerts',
        enabled: true,
        correlationId: 'first'
      })
    );
    const secondOptimistic = optimisticRollbackReducer(
      firstOptimistic,
      OptimisticRollbackActions.toggleFlagOptimistic({
        id: 'email-alerts',
        enabled: false,
        correlationId: 'second'
      })
    );
    const afterFirstFailure = optimisticRollbackReducer(
      secondOptimistic,
      OptimisticRollbackActions.toggleFlagFailure({
        id: 'email-alerts',
        correlationId: 'first',
        error: 'Rejected first'
      })
    );

    expect(afterFirstFailure.entities['email-alerts'].enabled).toBe(false);
    expect(afterFirstFailure.pending['email-alerts']).toEqual([
      { correlationId: 'second', enabled: false }
    ]);
  });

  it('reverts to the server value when every pending update fails', () => {
    const firstOptimistic = optimisticRollbackReducer(
      initialOptimisticRollbackState,
      OptimisticRollbackActions.toggleFlagOptimistic({
        id: 'email-alerts',
        enabled: true,
        correlationId: 'first'
      })
    );
    const secondOptimistic = optimisticRollbackReducer(
      firstOptimistic,
      OptimisticRollbackActions.toggleFlagOptimistic({
        id: 'email-alerts',
        enabled: true,
        correlationId: 'second'
      })
    );
    const afterFirstFailure = optimisticRollbackReducer(
      secondOptimistic,
      OptimisticRollbackActions.toggleFlagFailure({
        id: 'email-alerts',
        correlationId: 'first',
        error: 'Rejected first'
      })
    );
    const afterSecondFailure = optimisticRollbackReducer(
      afterFirstFailure,
      OptimisticRollbackActions.toggleFlagFailure({
        id: 'email-alerts',
        correlationId: 'second',
        error: 'Rejected second'
      })
    );

    expect(afterSecondFailure.entities['email-alerts'].enabled).toBe(false);
    expect(afterSecondFailure.pending['email-alerts']).toEqual([]);
  });
});