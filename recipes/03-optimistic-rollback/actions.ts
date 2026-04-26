import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
}

export const OptimisticRollbackActions = createActionGroup({
  source: 'Optimistic Rollback',
  events: {
    'Toggle Flag Optimistic': props<{ id: string; enabled: boolean; correlationId: string }>(),
    'Toggle Flag Success': props<{ id: string; enabled: boolean; correlationId: string }>(),
    'Toggle Flag Failure': props<{ id: string; correlationId: string; error: string }>(),
    'Reset Demo': emptyProps()
  }
});