import { createSelector } from '@ngrx/store';

import { cancelOnRouteFeature } from './reducer';

export const { selectCancelOnRouteState } = cancelOnRouteFeature;

export const selectCancelOnRouteVm = createSelector(selectCancelOnRouteState, (state) => ({
  ...state,
  hasOrder: state.currentOrder !== null
}));