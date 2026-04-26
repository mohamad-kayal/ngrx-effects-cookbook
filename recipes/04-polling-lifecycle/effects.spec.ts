import { TestScheduler } from 'rxjs/testing';

import { PollingLifecycleActions } from './actions';
import { createPollingLifecycleEffect } from './effects';

const sample = (activeUsers: number) => ({ activeUsers, fetchedAt: `t${activeUsers}` });

describe('polling lifecycle effect', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('polls immediately and then at the configured interval', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      let activeUsers = 40;
      const actions$ = hot('a-------s', {
        a: PollingLifecycleActions.startPolling(),
        s: PollingLifecycleActions.stopPolling()
      });
      const visibility$ = hot('v--------', { v: 'visible' as const });
      const api = {
        fetchStatus: jest.fn(() => cold('-x|', { x: sample(++activeUsers) }))
      };

      expectObservable(
        createPollingLifecycleEffect(actions$, visibility$, hot('---------'), api, {
          intervalMs: 3,
          retryCount: 0,
          scheduler
        })
      ).toBe('-x--y--z-', {
        x: PollingLifecycleActions.pollSuccess({ sample: sample(41) }),
        y: PollingLifecycleActions.pollSuccess({ sample: sample(42) }),
        z: PollingLifecycleActions.pollSuccess({ sample: sample(43) })
      });
    });
  });

  it('pauses while the page is hidden and resumes when visible again', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      let activeUsers = 50;
      const actions$ = hot('a-----------s', {
        a: PollingLifecycleActions.startPolling(),
        s: PollingLifecycleActions.stopPolling()
      });
      const visibility$ = hot('v--h----v----', { v: 'visible' as const, h: 'hidden' as const });
      const api = {
        fetchStatus: jest.fn(() => cold('-x|', { x: sample(++activeUsers) }))
      };

      expectObservable(
        createPollingLifecycleEffect(actions$, visibility$, hot('-------------'), api, {
          intervalMs: 3,
          retryCount: 0,
          scheduler
        })
      ).toBe('-x-------y---', {
        x: PollingLifecycleActions.pollSuccess({ sample: sample(51) }),
        y: PollingLifecycleActions.pollSuccess({ sample: sample(52) })
      });
    });
  });

  it('hard-stops on logout', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      let activeUsers = 60;
      const actions$ = hot('a---l----', {
        a: PollingLifecycleActions.startPolling(),
        l: PollingLifecycleActions.logout()
      });
      const visibility$ = hot('v--------', { v: 'visible' as const });
      const api = {
        fetchStatus: jest.fn(() => cold('-x|', { x: sample(++activeUsers) }))
      };

      expectObservable(
        createPollingLifecycleEffect(actions$, visibility$, hot('---------'), api, {
          intervalMs: 2,
          retryCount: 0,
          scheduler
        })
      ).toBe('-x-y-----', {
        x: PollingLifecycleActions.pollSuccess({ sample: sample(61) }),
        y: PollingLifecycleActions.pollSuccess({ sample: sample(62) })
      });
    });
  });

  it('backs off poll errors and stops after the retry cap', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a', { a: PollingLifecycleActions.startPolling() });
      const visibility$ = hot('v', { v: 'visible' as const });
      const api = {
        fetchStatus: jest.fn(() => cold('-#', {}, new Error('offline')))
      };

      expectObservable(
        createPollingLifecycleEffect(actions$, visibility$, hot('-----'), api as any, {
          intervalMs: 10,
          retryCount: 1,
          retryDelayMs: 2,
          scheduler
        })
      ).toBe('----(fs)', {
        f: PollingLifecycleActions.pollFailure({ error: 'offline' }),
        s: PollingLifecycleActions.pollingStopped({ reason: 'error' })
      });
    });
  });
});