import { createSelector } from '@ngrx/store';

import { retryBackoffFeature } from './reducer';

export const { selectRetryBackoffState } = retryBackoffFeature;

export const selectRetryBackoffVm = createSelector(selectRetryBackoffState, (state) => ({
  ...state,
  isBusy: state.status === 'loading' || state.status === 'retrying'
}));