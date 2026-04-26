import { createSelector } from '@ngrx/store';

import { coordinationFeature } from './reducer';

export const { selectCoordinationState } = coordinationFeature;

export const selectCurrentUser = createSelector(selectCoordinationState, (state) => state.user);

export const selectCoordinationVm = createSelector(selectCoordinationState, (state) => ({
  ...state,
  tenantReady: state.user !== null
}));