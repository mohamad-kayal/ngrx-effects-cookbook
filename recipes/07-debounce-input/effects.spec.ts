import { TestScheduler } from 'rxjs/testing';

import { DebounceInputActions } from './actions';
import { DebounceInputApi } from './api';
import { createDebouncedSearchEffect, createTypingIndicatorEffect } from './effects';

describe('debounce input effects', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('emits typing state immediately on every keystroke', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const actions$ = hot('a-b', {
        a: DebounceInputActions.searchInput({ query: 'n' }),
        b: DebounceInputActions.searchInput({ query: 'ng' })
      });

      expectObservable(createTypingIndicatorEffect(actions$)).toBe('a-b', {
        a: DebounceInputActions.searchTyping({ query: 'n' }),
        b: DebounceInputActions.searchTyping({ query: 'ng' })
      });
    });
  });

  it('debounces rapid keystrokes into one request for the last query', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const results = [{ id: 'ngrx-docs', label: 'ngrx docs' }];
      const actions$ = hot('a-b-c----', {
        a: DebounceInputActions.searchInput({ query: 'n' }),
        b: DebounceInputActions.searchInput({ query: 'ng' }),
        c: DebounceInputActions.searchInput({ query: 'ngrx' })
      });
      const api = { search: jest.fn(() => cold('--r|', { r: results })) };

      expectObservable(
        createDebouncedSearchEffect(actions$, api, { debounceMs: 3, scheduler })
      ).toBe('-------l-s', {
        l: DebounceInputActions.searchLoading({ query: 'ngrx' }),
        s: DebounceInputActions.searchSuccess({ query: 'ngrx', results })
      });
    });
  });

  it('skips a duplicate query after the first request succeeds', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const results = [{ id: 'ngrx-docs', label: 'ngrx docs' }];
      const actions$ = hot('a----b---', {
        a: DebounceInputActions.searchInput({ query: 'ngrx' }),
        b: DebounceInputActions.searchInput({ query: 'ngrx' })
      });
      const api: Pick<DebounceInputApi, 'search'> = {
        search: jest.fn(() => cold('-r|', { r: results }))
      };

      expectObservable(
        createDebouncedSearchEffect(actions$, api, { debounceMs: 2, scheduler })
      ).toBe('--ls-----', {
        l: DebounceInputActions.searchLoading({ query: 'ngrx' }),
        s: DebounceInputActions.searchSuccess({ query: 'ngrx', results })
      });
    });
  });

  it('turns empty input into a clear action without calling the API', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const actions$ = hot('a---', { a: DebounceInputActions.searchInput({ query: '   ' }) });
      const api: Pick<DebounceInputApi, 'search'> = {
        search: jest.fn(() => cold('-r|', { r: [] }))
      };

      expectObservable(
        createDebouncedSearchEffect(actions$, api, { debounceMs: 2, scheduler })
      ).toBe('--c-', {
        c: DebounceInputActions.searchCleared()
      });
      expect(api.search).not.toHaveBeenCalled();
    });
  });

  it('allows the same query to be retried after a failed request', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const results = [{ id: 'ngrx-docs', label: 'ngrx docs' }];
      const actions$ = hot('a----b------', {
        a: DebounceInputActions.searchInput({ query: 'ngrx' }),
        b: DebounceInputActions.searchInput({ query: 'ngrx' })
      });
      let requestCount = 0;
      const api: Pick<DebounceInputApi, 'search'> = {
        search: jest.fn(() => {
          requestCount += 1;
          return requestCount === 1
            ? cold('-#', {}, new Error('offline'))
            : cold('-r|', { r: results });
        })
      };

      expectObservable(
        createDebouncedSearchEffect(actions$, api, { debounceMs: 2, scheduler })
      ).toBe('--lf---ms----', {
        l: DebounceInputActions.searchLoading({ query: 'ngrx' }),
        f: DebounceInputActions.searchFailure({ query: 'ngrx', error: 'offline' }),
        m: DebounceInputActions.searchLoading({ query: 'ngrx' }),
        s: DebounceInputActions.searchSuccess({ query: 'ngrx', results })
      });
    });
  });

  it('cancels an in-flight request when the next keystroke arrives', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const firstResults = [{ id: 'ngrx-docs', label: 'ngrx docs' }];
      const secondResults = [{ id: 'effects-docs', label: 'effects docs' }];
      const actions$ = hot('a---b---------', {
        a: DebounceInputActions.searchInput({ query: 'ngrx' }),
        b: DebounceInputActions.searchInput({ query: 'effects' })
      });
      const api = {
        search: jest.fn((query: string) =>
          query === 'ngrx'
            ? cold('-----r|', { r: firstResults })
            : cold('-----r|', { r: secondResults })
        )
      };

      expectObservable(
        createDebouncedSearchEffect(actions$, api, { debounceMs: 2, scheduler })
      ).toBe('--l---m----s---', {
        l: DebounceInputActions.searchLoading({ query: 'ngrx' }),
        m: DebounceInputActions.searchLoading({ query: 'effects' }),
        s: DebounceInputActions.searchSuccess({ query: 'effects', results: secondResults })
      });
    });
  });
});