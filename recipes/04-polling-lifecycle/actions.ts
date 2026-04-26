import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface PollSample {
  activeUsers: number;
  fetchedAt: string;
}

export const PollingLifecycleActions = createActionGroup({
  source: 'Polling Lifecycle',
  events: {
    'Start Polling': emptyProps(),
    'Stop Polling': emptyProps(),
    Logout: emptyProps(),
    'Poll Success': props<{ sample: PollSample }>(),
    'Poll Failure': props<{ error: string }>(),
    'Polling Stopped': props<{ reason: 'manual' | 'logout' | 'route' | 'error' }>(),
    'Reset Demo': emptyProps()
  }
});