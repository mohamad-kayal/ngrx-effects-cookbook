import { createFeature, createReducer, on } from '@ngrx/store';

import { ReportSummary, RetryBackoffActions } from './actions';

export interface RetryBackoffState {
  status: 'idle' | 'loading' | 'retrying' | 'succeeded' | 'error';
  attempt: number;
  delayMs: number | null;
  report: ReportSummary | null;
  error: string | null;
  log: string[];
}

export const initialRetryBackoffState: RetryBackoffState = {
  status: 'idle',
  attempt: 0,
  delayMs: null,
  report: null,
  error: null,
  log: ['Ready']
};

const addLog = (state: RetryBackoffState, message: string): RetryBackoffState => ({
  ...state,
  log: [message, ...state.log].slice(0, 8)
});

export const retryBackoffReducer = createReducer(
  initialRetryBackoffState,
  on(RetryBackoffActions.loadReport, (state) =>
    addLog({ ...state, status: 'loading', attempt: 0, delayMs: null, error: null }, 'load started')
  ),
  on(RetryBackoffActions.loadReportRetrying, (state, { attempt, delayMs }) =>
    addLog({ ...state, status: 'retrying', attempt, delayMs }, `retry ${attempt} in ${delayMs}ms`)
  ),
  on(RetryBackoffActions.loadReportSuccess, (state, { report }) =>
    addLog(
      { ...state, status: 'succeeded', report, attempt: 0, delayMs: null, error: null },
      'report loaded'
    )
  ),
  on(RetryBackoffActions.loadReportFailure, (state, { error, status }) =>
    addLog({ ...state, status: 'error', error, delayMs: null }, `failed${status ? ` (${status})` : ''}`)
  ),
  on(RetryBackoffActions.resetDemo, () => initialRetryBackoffState)
);

export const retryBackoffFeature = createFeature({
  name: 'retryBackoff',
  reducer: retryBackoffReducer
});