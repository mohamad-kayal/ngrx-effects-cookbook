import { createSelector } from '@ngrx/store';

import { optimisticRollbackFeature } from './reducer';

export const { selectOptimisticRollbackState } = optimisticRollbackFeature;

export const selectOptimisticRollbackVm = createSelector(selectOptimisticRollbackState, (state) => ({
  ...state,
  flags: Object.values(state.entities),
  pendingCount: Object.values(state.pending).reduce((total, changes) => total + changes.length, 0)
}));