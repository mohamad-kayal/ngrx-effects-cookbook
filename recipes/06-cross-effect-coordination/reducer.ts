import { createFeature, createReducer, on } from '@ngrx/store';

import { CoordinationActions, CurrentUser, DashboardSummary } from './actions';

export interface CoordinationState {
  user: CurrentUser | null;
  dashboard: DashboardSummary | null;
  status: 'idle' | 'loading-user' | 'loading-dashboard' | 'loaded' | 'error';
  error: string | null;
  log: string[];
}

export const initialCoordinationState: CoordinationState = {
  user: null,
  dashboard: null,
  status: 'idle',
  error: null,
  log: ['Ready']
};

const addLog = (state: CoordinationState, message: string): CoordinationState => ({
  ...state,
  log: [message, ...state.log].slice(0, 10)
});

export const coordinationReducer = createReducer(
  initialCoordinationState,
  on(CoordinationActions.loadCurrentUser, (state) =>
    addLog({ ...state, status: 'loading-user', error: null }, 'loading current user')
  ),
  on(CoordinationActions.loadCurrentUserSuccess, (state, { user }) =>
    addLog({ ...state, user, status: 'loaded', error: null }, `user ready: ${user.tenantId}`)
  ),
  on(CoordinationActions.loadCurrentUserFailure, (state, { error }) =>
    addLog({ ...state, status: 'error', error }, 'user failed')
  ),
  on(CoordinationActions.dashboardRequested, (state) =>
    addLog({ ...state, status: 'loading-dashboard', error: null }, 'dashboard requested')
  ),
  on(CoordinationActions.dashboardRouteEntered, (state) =>
    addLog({ ...state, status: 'loading-dashboard', error: null }, 'dashboard route entered')
  ),
  on(CoordinationActions.loadDashboardSuccess, (state, { dashboard }) =>
    addLog({ ...state, dashboard, status: 'loaded', error: null }, `dashboard loaded via ${dashboard.pattern}`)
  ),
  on(CoordinationActions.loadDashboardFailure, (state, { pattern, error }) =>
    addLog({ ...state, status: 'error', error }, `dashboard failed via ${pattern}`)
  ),
  on(CoordinationActions.resetDemo, () => initialCoordinationState)
);

export const coordinationFeature = createFeature({
  name: 'coordination',
  reducer: coordinationReducer
});