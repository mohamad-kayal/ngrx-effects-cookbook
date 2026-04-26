import { createActionGroup, emptyProps, props } from '@ngrx/store';

export interface OrderDetails {
  id: string;
  customer: string;
  total: number;
}

export const CancelOnRouteActions = createActionGroup({
  source: 'Cancel On Route',
  events: {
    'Load Order': props<{ id: string }>(),
    'Load Order With Explicit Cancel': props<{ id: string }>(),
    'Unsafe Load Order': props<{ id: string }>(),
    'Cancel Load Order': emptyProps(),
    'Load Order Success': props<{ order: OrderDetails }>(),
    'Load Order Failure': props<{ id: string; error: string }>(),
    'Reset Demo': emptyProps()
  }
});