import { createFeature, createReducer, on } from '@ngrx/store';

import { PollSample, PollingLifecycleActions } from './actions';

export interface PollingLifecycleState {
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'error';
  lastSample: PollSample | null;
  error: string | null;
  log: string[];
}

export const initialPollingLifecycleState: PollingLifecycleState = {
  status: 'idle',
  lastSample: null,
  error: null,
  log: ['Ready']
};

const addLog = (state: PollingLifecycleState, message: string): PollingLifecycleState => ({
  ...state,
  log: [message, ...state.log].slice(0, 10)
});

export const pollingLifecycleReducer = createReducer(
  initialPollingLifecycleState,
  on(PollingLifecycleActions.startPolling, (state) =>
    addLog({ ...state, status: 'running', error: null }, 'polling started')
  ),
  on(PollingLifecycleActions.stopPolling, (state) =>
    addLog({ ...state, status: 'stopped' }, 'manual stop requested')
  ),
  on(PollingLifecycleActions.logout, (state) =>
    addLog({ ...state, status: 'stopped' }, 'logout stop requested')
  ),
  on(PollingLifecycleActions.pollSuccess, (state, { sample }) =>
    addLog({ ...state, status: 'running', lastSample: sample, error: null }, `sample ${sample.activeUsers}`)
  ),
  on(PollingLifecycleActions.pollFailure, (state, { error }) =>
    addLog({ ...state, status: 'error', error }, `poll failed: ${error}`)
  ),
  on(PollingLifecycleActions.pollingStopped, (state, { reason }) =>
    addLog({ ...state, status: reason === 'error' ? 'error' : 'stopped' }, `stopped: ${reason}`)
  ),
  on(PollingLifecycleActions.resetDemo, () => initialPollingLifecycleState)
);

export const pollingLifecycleFeature = createFeature({
  name: 'pollingLifecycle',
  reducer: pollingLifecycleReducer
});