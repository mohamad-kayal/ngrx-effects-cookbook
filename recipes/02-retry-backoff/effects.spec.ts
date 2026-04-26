import { Action } from '@ngrx/store';
import { defer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

import { RetryBackoffActions } from './actions';
import { createLoadReportEffect } from './effects';

describe('retry backoff effect', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('retries retryable errors with growing deterministic delays', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const emitted: Action[] = [];
      const retryActions: Action[] = [];
      let attemptCount = 0;
      const report = { id: 'report', title: 'Report', generatedAt: 'now' };
      const actions$ = hot('a', { a: RetryBackoffActions.loadReport() });
      const api = {
        loadReport: jest.fn(() =>
          defer(() => {
            attemptCount += 1;
            return attemptCount < 3
              ? cold('-#', {}, { status: 503, message: 'Down' })
              : cold('-r|', { r: report });
          })
        )
      };

      createLoadReportEffect(
        actions$,
        api as any,
        { baseDelayMs: 2, maxRetries: 3, jitter: (maxDelayMs) => maxDelayMs, scheduler },
        (action) => retryActions.push(action)
      ).subscribe((action) => emitted.push(action));

      flush();

      expect(retryActions).toEqual([
        RetryBackoffActions.loadReportRetrying({ attempt: 1, delayMs: 4 }),
        RetryBackoffActions.loadReportRetrying({ attempt: 2, delayMs: 8 })
      ]);
      expect(emitted).toEqual([RetryBackoffActions.loadReportSuccess({ report })]);
    });
  });

  it('does not retry a 401', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const emitted: Action[] = [];
      const retryActions: Action[] = [];
      const actions$ = hot('a', { a: RetryBackoffActions.loadReport() });
      const api = {
        loadReport: jest.fn(() => cold('-#', {}, { status: 401, message: 'Unauthorized' }))
      };

      createLoadReportEffect(
        actions$,
        api as any,
        { baseDelayMs: 2, maxRetries: 3, jitter: (maxDelayMs) => maxDelayMs, scheduler },
        (action) => retryActions.push(action)
      ).subscribe((action) => emitted.push(action));

      flush();

      expect(retryActions).toEqual([]);
      expect(emitted).toEqual([
        RetryBackoffActions.loadReportFailure({ error: 'Unauthorized', status: 401 })
      ]);
    });
  });

  it('surfaces the final error when the retry cap is reached', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const emitted: Action[] = [];
      let attemptCount = 0;
      const actions$ = hot('a', { a: RetryBackoffActions.loadReport() });
      const api = {
        loadReport: jest.fn(() =>
          defer(() => {
            attemptCount += 1;
            return cold('-#', {}, { status: 503, message: `Down ${attemptCount}` });
          })
        )
      };

      createLoadReportEffect(actions$, api as any, {
        baseDelayMs: 1,
        maxRetries: 2,
        jitter: (maxDelayMs) => maxDelayMs,
        scheduler
      }).subscribe((action) => emitted.push(action));

      flush();

      expect(attemptCount).toBe(3);
      expect(emitted).toEqual([
        RetryBackoffActions.loadReportFailure({ error: 'Down 3', status: 503 })
      ]);
    });
  });
});