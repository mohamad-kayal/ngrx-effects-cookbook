import { createFeature, createReducer, on } from '@ngrx/store';

import { DraftReceipt, RaceConditionsActions, UploadReceipt, UserResult } from './actions';

export interface RaceConditionsState {
  search: {
    query: string;
    status: 'idle' | 'loading' | 'resolved' | 'error';
    results: UserResult[];
    error: string | null;
  };
  draft: {
    status: 'idle' | 'saving' | 'saved' | 'error';
    lastReceipt: DraftReceipt | null;
    error: string | null;
  };
  payment: {
    status: 'idle' | 'submitting' | 'succeeded' | 'error';
    confirmation: string | null;
    error: string | null;
  };
  uploads: UploadReceipt[];
  log: string[];
}

export const initialRaceConditionsState: RaceConditionsState = {
  search: { query: '', status: 'idle', results: [], error: null },
  draft: { status: 'idle', lastReceipt: null, error: null },
  payment: { status: 'idle', confirmation: null, error: null },
  uploads: [],
  log: ['Ready']
};

const addLog = (state: RaceConditionsState, message: string): RaceConditionsState => ({
  ...state,
  log: [message, ...state.log].slice(0, 8)
});

export const raceConditionsReducer = createReducer(
  initialRaceConditionsState,
  on(RaceConditionsActions.searchUsers, (state, { query }) =>
    addLog(
      {
        ...state,
        search: { query, status: 'loading', results: state.search.results, error: null }
      },
      `switchMap search started: ${query}`
    )
  ),
  on(RaceConditionsActions.searchUsersSuccess, (state, { query, results }) =>
    addLog({ ...state, search: { query, status: 'resolved', results, error: null } }, `search won: ${query}`)
  ),
  on(RaceConditionsActions.searchUsersFailure, (state, { query, error }) =>
    addLog({ ...state, search: { query, status: 'error', results: [], error } }, `search failed: ${query}`)
  ),
  on(RaceConditionsActions.saveDraft, (state, { content }) =>
    addLog({ ...state, draft: { ...state.draft, status: 'saving', error: null } }, `concatMap queued draft: ${content}`)
  ),
  on(RaceConditionsActions.saveDraftSuccess, (state, { receipt }) =>
    addLog({ ...state, draft: { status: 'saved', lastReceipt: receipt, error: null } }, `draft saved v${receipt.version}`)
  ),
  on(RaceConditionsActions.saveDraftFailure, (state, { content, error }) =>
    addLog({ ...state, draft: { ...state.draft, status: 'error', error } }, `draft failed: ${content}`)
  ),
  on(RaceConditionsActions.submitPayment, (state, { amount }) =>
    addLog({ ...state, payment: { ...state.payment, status: 'submitting', error: null } }, `exhaustMap submit: $${amount}`)
  ),
  on(RaceConditionsActions.submitPaymentSuccess, (state, { confirmation }) =>
    addLog({ ...state, payment: { status: 'succeeded', confirmation, error: null } }, `payment confirmed: ${confirmation}`)
  ),
  on(RaceConditionsActions.submitPaymentFailure, (state, { error }) =>
    addLog({ ...state, payment: { ...state.payment, status: 'error', error } }, 'payment failed')
  ),
  on(RaceConditionsActions.uploadAvatar, (state, { fileName }) =>
    addLog(state, `mergeMap upload started: ${fileName}`)
  ),
  on(RaceConditionsActions.uploadAvatarSuccess, (state, { receipt }) =>
    addLog({ ...state, uploads: [receipt, ...state.uploads].slice(0, 5) }, `upload done: ${receipt.fileName}`)
  ),
  on(RaceConditionsActions.uploadAvatarFailure, (state, { fileName, error }) =>
    addLog({ ...state, log: state.log }, `upload failed: ${fileName} (${error})`)
  ),
  on(RaceConditionsActions.resetDemo, () => initialRaceConditionsState)
);

export const raceConditionsFeature = createFeature({
  name: 'raceConditions',
  reducer: raceConditionsReducer
});