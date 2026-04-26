import { createSelector } from '@ngrx/store';

import { raceConditionsFeature } from './reducer';

export const { selectRaceConditionsState } = raceConditionsFeature;

export const selectRaceConditionsVm = createSelector(selectRaceConditionsState, (state) => ({
  ...state,
  hasSearchResults: state.search.results.length > 0,
  uploadCount: state.uploads.length
}));