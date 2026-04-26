import { createFeature, createReducer, on } from '@ngrx/store';

import { FeatureFlag, OptimisticRollbackActions } from './actions';

export interface PendingFlagChange {
  correlationId: string;
  enabled: boolean;
}

export interface OptimisticRollbackState {
  entities: Record<string, FeatureFlag>;
  serverEntities: Record<string, FeatureFlag>;
  pending: Record<string, PendingFlagChange[]>;
  error: string | null;
  log: string[];
}

const initialFlags: Record<string, FeatureFlag> = {
  'email-alerts': { id: 'email-alerts', name: 'Email alerts', enabled: false },
  'weekly-digest': { id: 'weekly-digest', name: 'Weekly digest', enabled: true }
};

export const initialOptimisticRollbackState: OptimisticRollbackState = {
  entities: initialFlags,
  serverEntities: initialFlags,
  pending: {},
  error: null,
  log: ['Ready']
};

const addLog = (state: OptimisticRollbackState, message: string): OptimisticRollbackState => ({
  ...state,
  log: [message, ...state.log].slice(0, 8)
});

function rebuildEntity(
  id: string,
  serverEntities: Record<string, FeatureFlag>,
  pending: Record<string, PendingFlagChange[]>
): FeatureFlag {
  const serverEntity = serverEntities[id];
  const pendingStack = pending[id] ?? [];
  const latestPending = pendingStack.at(-1);

  return {
    ...serverEntity,
    enabled: latestPending ? latestPending.enabled : serverEntity.enabled
  };
}

function withoutCorrelation(
  pending: Record<string, PendingFlagChange[]>,
  id: string,
  correlationId: string
): Record<string, PendingFlagChange[]> {
  return {
    ...pending,
    [id]: (pending[id] ?? []).filter((change) => change.correlationId !== correlationId)
  };
}

export const optimisticRollbackReducer = createReducer(
  initialOptimisticRollbackState,
  on(OptimisticRollbackActions.toggleFlagOptimistic, (state, { id, enabled, correlationId }) => {
    const pending = {
      ...state.pending,
      [id]: [...(state.pending[id] ?? []), { correlationId, enabled }]
    };

    return addLog(
      {
        ...state,
        pending,
        entities: { ...state.entities, [id]: rebuildEntity(id, state.serverEntities, pending) },
        error: null
      },
      `optimistic ${id} -> ${enabled} (${correlationId})`
    );
  }),
  on(OptimisticRollbackActions.toggleFlagSuccess, (state, { id, enabled, correlationId }) => {
    const serverEntities = {
      ...state.serverEntities,
      [id]: { ...state.serverEntities[id], enabled }
    };
    const pending = withoutCorrelation(state.pending, id, correlationId);

    return addLog(
      { ...state, serverEntities, pending, entities: { ...state.entities, [id]: rebuildEntity(id, serverEntities, pending) } },
      `confirmed ${correlationId}`
    );
  }),
  on(OptimisticRollbackActions.toggleFlagFailure, (state, { id, correlationId, error }) => {
    const pending = withoutCorrelation(state.pending, id, correlationId);

    return addLog(
      {
        ...state,
        pending,
        entities: { ...state.entities, [id]: rebuildEntity(id, state.serverEntities, pending) },
        error
      },
      `rolled back ${correlationId}`
    );
  }),
  on(OptimisticRollbackActions.resetDemo, () => initialOptimisticRollbackState)
);

export const optimisticRollbackFeature = createFeature({
  name: 'optimisticRollback',
  reducer: optimisticRollbackReducer
});