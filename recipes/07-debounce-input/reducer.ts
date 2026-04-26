import { createFeature, createReducer, on } from '@ngrx/store';

import { DebounceInputActions, SearchResult } from './actions';

export interface DebounceInputState {
  query: string;
  status: 'idle' | 'typing' | 'loading' | 'resolved' | 'error';
  results: SearchResult[];
  error: string | null;
  log: string[];
}

export const initialDebounceInputState: DebounceInputState = {
  query: '',
  status: 'idle',
  results: [],
  error: null,
  log: ['Ready']
};

const addLog = (state: DebounceInputState, message: string): DebounceInputState => ({
  ...state,
  log: [message, ...state.log].slice(0, 10)
});

export const debounceInputReducer = createReducer(
  initialDebounceInputState,
  on(DebounceInputActions.searchInput, (state, { query }) =>
    addLog({ ...state, query }, `input: ${query || '(empty)'}`)
  ),
  on(DebounceInputActions.searchTyping, (state, { query }) =>
    addLog({ ...state, query, status: 'typing', error: null }, `typing: ${query || '(empty)'}`)
  ),
  on(DebounceInputActions.searchLoading, (state, { query }) =>
    addLog({ ...state, query, status: 'loading', error: null }, `loading: ${query}`)
  ),
  on(DebounceInputActions.searchSuccess, (state, { query, results }) =>
    addLog({ ...state, query, status: 'resolved', results, error: null }, `resolved: ${query}`)
  ),
  on(DebounceInputActions.searchFailure, (state, { query, error }) =>
    addLog({ ...state, query, status: 'error', error }, `failed: ${query}`)
  ),
  on(DebounceInputActions.searchCleared, (state) =>
    addLog({ ...state, query: '', status: 'idle', results: [], error: null }, 'cleared')
  ),
  on(DebounceInputActions.resetDemo, () => initialDebounceInputState)
);

export const debounceInputFeature = createFeature({
  name: 'debounceInput',
  reducer: debounceInputReducer
});