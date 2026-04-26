import { Observable, SchedulerLike, asyncScheduler, map, take, timer } from 'rxjs';

import { JobProgressEvent } from './actions';

export interface SimulateProgressOptions {
  jobId: string;
  totalMs?: number;
  steps?: number;
  failAtStep?: number;
  scheduler?: SchedulerLike;
}

const messages = [
  'Queued',
  'Reading source data',
  'Aggregating rows',
  'Formatting report',
  'Writing artifact',
  'Done'
];

export function simulateProgress(options: SimulateProgressOptions): Observable<JobProgressEvent> {
  const steps = options.steps ?? 10;
  const totalMs = options.totalMs ?? 5_000;
  const scheduler = options.scheduler ?? asyncScheduler;
  const stepMs = Math.max(1, Math.floor(totalMs / steps));

  return timer(0, stepMs, scheduler).pipe(
    take(steps + 1),
    map((step) => {
      if (options.failAtStep === step) {
        throw new Error(`Job ${options.jobId} failed at step ${step}`);
      }

      const progress = Math.round((step / steps) * 100);
      const messageIndex = Math.min(messages.length - 1, Math.floor((progress / 100) * (messages.length - 1)));

      return {
        jobId: options.jobId,
        progress,
        message: messages[messageIndex]
      };
    })
  );
}