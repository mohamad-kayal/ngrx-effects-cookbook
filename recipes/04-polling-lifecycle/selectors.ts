import { createSelector } from '@ngrx/store';

import { pollingLifecycleFeature } from './reducer';

export const { selectPollingLifecycleState } = pollingLifecycleFeature;

export const selectPollingLifecycleVm = createSelector(selectPollingLifecycleState, (state) => ({
  ...state,
  isRunning: state.status === 'running'
}));