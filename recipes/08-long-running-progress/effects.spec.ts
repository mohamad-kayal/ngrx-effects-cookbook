import { Action } from '@ngrx/store';
import { TestScheduler } from 'rxjs/testing';

import { JobProgressEvent, LongRunningProgressActions } from './actions';
import { createLongRunningProgressEffect } from './effects';

const event = (jobId: string, progress: number): JobProgressEvent => ({
  jobId,
  progress,
  message: `${progress}%`
});

describe('long-running progress effect', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('maps progress events and final completion into store actions', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const emitted: Action[] = [];
      const actions$ = hot('a', { a: LongRunningProgressActions.startJob({ jobId: 'job-1' }) });
      const progressStream = jest.fn(() =>
        cold('a-b-c|', { a: event('job-1', 0), b: event('job-1', 50), c: event('job-1', 100) })
      );

      createLongRunningProgressEffect(actions$, hot('------'), progressStream).subscribe((action) =>
        emitted.push(action)
      );
      flush();

      expect(emitted).toEqual([
        LongRunningProgressActions.jobProgress({ event: event('job-1', 0) }),
        LongRunningProgressActions.jobProgress({ event: event('job-1', 50) }),
        LongRunningProgressActions.jobProgress({ event: event('job-1', 100) }),
        LongRunningProgressActions.jobSucceeded({
          jobId: 'job-1',
          result: { reportUrl: '/reports/job-1.pdf' }
        }),
        LongRunningProgressActions.jobFinalized({ jobId: 'job-1' })
      ]);
    });
  });

  it('emits failure and finalization when the progress stream errors', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const emitted: Action[] = [];
      const actions$ = hot('a', { a: LongRunningProgressActions.startJob({ jobId: 'job-2' }) });
      const progressStream = jest.fn(() => cold('a-#', { a: event('job-2', 20) }, new Error('boom')));

      createLongRunningProgressEffect(actions$, hot('----'), progressStream).subscribe((action) =>
        emitted.push(action)
      );
      flush();

      expect(emitted).toEqual([
        LongRunningProgressActions.jobProgress({ event: event('job-2', 20) }),
        LongRunningProgressActions.jobFailed({ jobId: 'job-2', error: 'boom' }),
        LongRunningProgressActions.jobFinalized({ jobId: 'job-2' })
      ]);
    });
  });

  it('cancels the stream and finalizes when cancelJob is dispatched', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const emitted: Action[] = [];
      const actions$ = hot('a---c----', {
        a: LongRunningProgressActions.startJob({ jobId: 'job-3' }),
        c: LongRunningProgressActions.cancelJob({ jobId: 'job-3' })
      });
      const progressStream = jest.fn(() =>
        cold('a-b-c-d|', {
          a: event('job-3', 0),
          b: event('job-3', 25),
          c: event('job-3', 50),
          d: event('job-3', 75)
        })
      );

      createLongRunningProgressEffect(actions$, hot('---------'), progressStream).subscribe((action) =>
        emitted.push(action)
      );
      flush();

      expect(emitted).toEqual([
        LongRunningProgressActions.jobProgress({ event: event('job-3', 0) }),
        LongRunningProgressActions.jobProgress({ event: event('job-3', 25) }),
        LongRunningProgressActions.jobFinalized({ jobId: 'job-3' })
      ]);
    });
  });

  it('cancels on route exit', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const emitted: Action[] = [];
      const actions$ = hot('a------', { a: LongRunningProgressActions.startJob({ jobId: 'job-4' }) });
      const routeExit$ = hot('---r---', { r: 'NavigationStart' });
      const progressStream = jest.fn(() =>
        cold('a-b-c|', { a: event('job-4', 0), b: event('job-4', 50), c: event('job-4', 100) })
      );

      createLongRunningProgressEffect(actions$, routeExit$, progressStream).subscribe((action) =>
        emitted.push(action)
      );
      flush();

      expect(emitted).toEqual([
        LongRunningProgressActions.jobProgress({ event: event('job-4', 0) }),
        LongRunningProgressActions.jobProgress({ event: event('job-4', 50) }),
        LongRunningProgressActions.jobFinalized({ jobId: 'job-4' })
      ]);
    });
  });

  it('starting a new job finalizes the old stream and runs the new one', () => {
    scheduler.run(({ hot, cold, flush }) => {
      const emitted: Action[] = [];
      const actions$ = hot('a---b------', {
        a: LongRunningProgressActions.startJob({ jobId: 'job-old' }),
        b: LongRunningProgressActions.startJob({ jobId: 'job-new' })
      });
      const progressStream = jest.fn(({ jobId }: { jobId: string }) =>
        cold('a-b-c|', { a: event(jobId, 0), b: event(jobId, 50), c: event(jobId, 100) })
      );

      createLongRunningProgressEffect(actions$, hot('-----------'), progressStream).subscribe((action) =>
        emitted.push(action)
      );
      flush();

      expect(emitted).toEqual([
        LongRunningProgressActions.jobProgress({ event: event('job-old', 0) }),
        LongRunningProgressActions.jobProgress({ event: event('job-old', 50) }),
        LongRunningProgressActions.jobFinalized({ jobId: 'job-old' }),
        LongRunningProgressActions.jobProgress({ event: event('job-new', 0) }),
        LongRunningProgressActions.jobProgress({ event: event('job-new', 50) }),
        LongRunningProgressActions.jobProgress({ event: event('job-new', 100) }),
        LongRunningProgressActions.jobSucceeded({
          jobId: 'job-new',
          result: { reportUrl: '/reports/job-new.pdf' }
        }),
        LongRunningProgressActions.jobFinalized({ jobId: 'job-new' })
      ]);
    });
  });
});