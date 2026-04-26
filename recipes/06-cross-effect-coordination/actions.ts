import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface CurrentUser {
  id: string;
  name: string;
  tenantId: string;
}

export interface DashboardSummary {
  tenantId: string;
  revenue: number;
  openTickets: number;
  pattern: CoordinationPattern;
}

export type CoordinationPattern = 'coordination-action' | 'route-pivot' | 'ready-selector';

export const CoordinationActions = createActionGroup({
  source: 'Cross Effect Coordination',
  events: {
    'Load Current User': emptyProps(),
    'Load Current User Success': props<{ user: CurrentUser }>(),
    'Load Current User Failure': props<{ error: string }>(),
    'Dashboard Requested': emptyProps(),
    'Dashboard Route Entered': emptyProps(),
    'Load Dashboard Success': props<{ dashboard: DashboardSummary }>(),
    'Load Dashboard Failure': props<{ pattern: CoordinationPattern; error: string }>(),
    'Reset Demo': emptyProps()
  }
});