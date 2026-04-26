import { createSelector } from '@ngrx/store';

import { debounceInputFeature } from './reducer';

export const { selectDebounceInputState } = debounceInputFeature;

export const selectDebounceInputVm = createSelector(selectDebounceInputState, (state) => ({
  ...state,
  hasResults: state.results.length > 0
}));