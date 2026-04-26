import { createSelector } from '@ngrx/store';

import { longRunningProgressFeature } from './reducer';

export const { selectLongRunningProgressState } = longRunningProgressFeature;

export const selectLongRunningProgressVm = createSelector(selectLongRunningProgressState, (state) => ({
  ...state,
  isRunning: state.status === 'running'
}));