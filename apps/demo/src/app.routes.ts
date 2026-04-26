import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { cancelOnRouteEffects } from '@recipes/cancel-on-route/effects';
import { cancelOnRouteFeature } from '@recipes/cancel-on-route/reducer';
import { coordinationEffects } from '@recipes/cross-effect-coordination/effects';
import { coordinationFeature } from '@recipes/cross-effect-coordination/reducer';
import { debounceInputEffects } from '@recipes/debounce-input/effects';
import { debounceInputFeature } from '@recipes/debounce-input/reducer';
import { longRunningProgressEffects } from '@recipes/long-running-progress/effects';
import { longRunningProgressFeature } from '@recipes/long-running-progress/reducer';
import { optimisticRollbackEffects } from '@recipes/optimistic-rollback/effects';
import { optimisticRollbackFeature } from '@recipes/optimistic-rollback/reducer';
import { pollingLifecycleEffects } from '@recipes/polling-lifecycle/effects';
import { pollingLifecycleFeature } from '@recipes/polling-lifecycle/reducer';
import { raceConditionsEffects } from '@recipes/race-conditions/effects';
import { raceConditionsFeature } from '@recipes/race-conditions/reducer';
import { retryBackoffEffects } from '@recipes/retry-backoff/effects';
import { retryBackoffFeature } from '@recipes/retry-backoff/reducer';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'race-conditions' },
  {
    path: 'race-conditions',
    providers: [provideState(raceConditionsFeature), provideEffects(raceConditionsEffects)],
    loadComponent: () => import('@recipes/race-conditions').then((m) => m.RaceConditionsComponent)
  },
  {
    path: 'retry-backoff',
    providers: [provideState(retryBackoffFeature), provideEffects(retryBackoffEffects)],
    loadComponent: () => import('@recipes/retry-backoff').then((m) => m.RetryBackoffComponent)
  },
  {
    path: 'optimistic-rollback',
    providers: [provideState(optimisticRollbackFeature), provideEffects(optimisticRollbackEffects)],
    loadComponent: () =>
      import('@recipes/optimistic-rollback').then((m) => m.OptimisticRollbackComponent)
  },
  {
    path: 'polling-lifecycle',
    providers: [provideState(pollingLifecycleFeature), provideEffects(pollingLifecycleEffects)],
    loadComponent: () =>
      import('@recipes/polling-lifecycle').then((m) => m.PollingLifecycleComponent)
  },
  {
    path: 'cancel-on-route',
    providers: [provideState(cancelOnRouteFeature), provideEffects(cancelOnRouteEffects)],
    loadComponent: () => import('@recipes/cancel-on-route').then((m) => m.CancelOnRouteComponent)
  },
  {
    path: 'cross-effect-coordination',
    providers: [provideState(coordinationFeature), provideEffects(coordinationEffects)],
    loadComponent: () =>
      import('@recipes/cross-effect-coordination').then((m) => m.CrossEffectCoordinationComponent)
  },
  {
    path: 'debounce-input',
    providers: [provideState(debounceInputFeature), provideEffects(debounceInputEffects)],
    loadComponent: () => import('@recipes/debounce-input').then((m) => m.DebounceInputComponent)
  },
  {
    path: 'long-running-progress',
    providers: [provideState(longRunningProgressFeature), provideEffects(longRunningProgressEffects)],
    loadComponent: () =>
      import('@recipes/long-running-progress').then((m) => m.LongRunningProgressComponent)
  },
  { path: '**', redirectTo: 'race-conditions' }
];