import { createFeature, createReducer, on } from '@ngrx/store';

import { CancelOnRouteActions, OrderDetails } from './actions';

export interface CancelOnRouteState {
  status: 'idle' | 'loading' | 'loaded' | 'cancelled' | 'error';
  currentOrder: OrderDetails | null;
  error: string | null;
  log: string[];
}

export const initialCancelOnRouteState: CancelOnRouteState = {
  status: 'idle',
  currentOrder: null,
  error: null,
  log: ['Ready']
};

const addLog = (state: CancelOnRouteState, message: string): CancelOnRouteState => ({
  ...state,
  log: [message, ...state.log].slice(0, 8)
});

export const cancelOnRouteReducer = createReducer(
  initialCancelOnRouteState,
  on(CancelOnRouteActions.loadOrder, (state, { id }) =>
    addLog({ ...state, status: 'loading', error: null }, `route-scoped load ${id}`)
  ),
  on(CancelOnRouteActions.loadOrderWithExplicitCancel, (state, { id }) =>
    addLog({ ...state, status: 'loading', error: null }, `explicit-cancel load ${id}`)
  ),
  on(CancelOnRouteActions.unsafeLoadOrder, (state, { id }) =>
    addLog({ ...state, status: 'loading', error: null }, `unsafe load ${id}`)
  ),
  on(CancelOnRouteActions.cancelLoadOrder, (state) =>
    addLog({ ...state, status: 'cancelled' }, 'load cancelled')
  ),
  on(CancelOnRouteActions.loadOrderSuccess, (state, { order }) =>
    addLog({ ...state, status: 'loaded', currentOrder: order, error: null }, `loaded order ${order.id}`)
  ),
  on(CancelOnRouteActions.loadOrderFailure, (state, { id, error }) =>
    addLog({ ...state, status: 'error', error }, `order ${id} failed`)
  ),
  on(CancelOnRouteActions.resetDemo, () => initialCancelOnRouteState)
);

export const cancelOnRouteFeature = createFeature({
  name: 'cancelOnRoute',
  reducer: cancelOnRouteReducer
});