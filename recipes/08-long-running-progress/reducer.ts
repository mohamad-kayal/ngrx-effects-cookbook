import { createFeature, createReducer, on } from '@ngrx/store';

import { JobProgressEvent, JobResult, LongRunningProgressActions } from './actions';

export interface LongRunningProgressState {
  jobId: string | null;
  status: 'idle' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  result: JobResult | null;
  error: string | null;
  finalizedJobs: string[];
  events: JobProgressEvent[];
  log: string[];
}

export const initialLongRunningProgressState: LongRunningProgressState = {
  jobId: null,
  status: 'idle',
  progress: 0,
  message: 'Idle',
  result: null,
  error: null,
  finalizedJobs: [],
  events: [],
  log: ['Ready']
};

const addLog = (state: LongRunningProgressState, message: string): LongRunningProgressState => ({
  ...state,
  log: [message, ...state.log].slice(0, 10)
});

export const longRunningProgressReducer = createReducer(
  initialLongRunningProgressState,
  on(LongRunningProgressActions.startJob, (state, { jobId }) =>
    addLog(
      { ...state, jobId, status: 'running', progress: 0, message: 'Starting', result: null, error: null, events: [] },
      `job started: ${jobId}`
    )
  ),
  on(LongRunningProgressActions.jobProgress, (state, { event }) =>
    addLog(
      {
        ...state,
        jobId: event.jobId,
        status: 'running',
        progress: event.progress,
        message: event.message,
        events: [...state.events, event].slice(-12)
      },
      `${event.jobId}: ${event.progress}%`
    )
  ),
  on(LongRunningProgressActions.jobSucceeded, (state, { jobId, result }) =>
    addLog({ ...state, jobId, status: 'succeeded', progress: 100, result, error: null }, `job succeeded: ${jobId}`)
  ),
  on(LongRunningProgressActions.jobFailed, (state, { jobId, error }) =>
    addLog({ ...state, jobId, status: 'failed', error }, `job failed: ${jobId}`)
  ),
  on(LongRunningProgressActions.cancelJob, (state, { jobId }) =>
    addLog({ ...state, jobId, status: 'cancelled' }, `job cancelled: ${jobId}`)
  ),
  on(LongRunningProgressActions.logout, (state) =>
    addLog({ ...state, status: 'cancelled' }, 'logout cancelled job')
  ),
  on(LongRunningProgressActions.jobFinalized, (state, { jobId }) =>
    addLog({ ...state, finalizedJobs: [jobId, ...state.finalizedJobs].slice(0, 6) }, `finalized: ${jobId}`)
  ),
  on(LongRunningProgressActions.resetDemo, () => initialLongRunningProgressState)
);

export const longRunningProgressFeature = createFeature({
  name: 'longRunningProgress',
  reducer: longRunningProgressReducer
});