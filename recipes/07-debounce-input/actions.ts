import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface SearchResult {
  id: string;
  label: string;
}

export const DebounceInputActions = createActionGroup({
  source: 'Debounce Input',
  events: {
    'Search Input': props<{ query: string }>(),
    'Search Typing': props<{ query: string }>(),
    'Search Loading': props<{ query: string }>(),
    'Search Success': props<{ query: string; results: SearchResult[] }>(),
    'Search Failure': props<{ query: string; error: string }>(),
    'Search Cleared': emptyProps(),
    'Reset Demo': emptyProps()
  }
});