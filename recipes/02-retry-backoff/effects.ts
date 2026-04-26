import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable, SchedulerLike, asyncScheduler, catchError, map, of, retry, switchMap, throwError, timer } from 'rxjs';

import { HttpLikeError, RetryBackoffActions } from './actions';
import { RetryBackoffApi } from './api';

export interface BackoffOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: (maxDelayMs: number) => number;
  scheduler: SchedulerLike;
}

export const defaultBackoffOptions: BackoffOptions = {
  maxRetries: 4,
  baseDelayMs: 400,
  maxDelayMs: 30_000,
  jitter: (maxDelayMs) => Math.random() * maxDelayMs,
  scheduler: asyncScheduler
};

export function isRetryableError(error: unknown): boolean {
  const status = statusFromError(error);
  return status === null || status === 0 || status === 408 || status === 429 || status >= 500;
}

export function statusFromError(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as HttpLikeError).status);
    return Number.isFinite(status) ? status : null;
  }

  return null;
}

export function messageFromError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as HttpLikeError).message);
  }

  return error instanceof Error ? error.message : 'Unknown error';
}

export function computeBackoffDelayMs(attempt: number, options: BackoffOptions): number {
  const upperBound = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** attempt);
  return Math.max(0, Math.floor(options.jitter(upperBound)));
}

export function createLoadReportEffect(
  actions$: Observable<Action>,
  api: Pick<RetryBackoffApi, 'loadReport'>,
  options: Partial<BackoffOptions> = {},
  notifyRetry: (action: Action) => void = () => undefined
): Observable<Action> {
  const backoffOptions = { ...defaultBackoffOptions, ...options };

  return actions$.pipe(
    ofType(RetryBackoffActions.loadReport),
    switchMap(() =>
      api.loadReport().pipe(
        retry({
          count: backoffOptions.maxRetries,
          resetOnSuccess: true,
          delay: (error: unknown, attempt: number) => {
            if (!isRetryableError(error)) {
              return throwError(() => error);
            }

            const delayMs = computeBackoffDelayMs(attempt, backoffOptions);
            notifyRetry(RetryBackoffActions.loadReportRetrying({ attempt, delayMs }));
            return timer(delayMs, backoffOptions.scheduler);
          }
        }),
        map((report) => RetryBackoffActions.loadReportSuccess({ report })),
        catchError((error: unknown) =>
          of(
            RetryBackoffActions.loadReportFailure({
              error: messageFromError(error),
              status: statusFromError(error)
            })
          )
        )
      )
    )
  );
}

const loadReportEffect = createEffect(
  (actions$ = inject(Actions), api = inject(RetryBackoffApi), store = inject(Store)) =>
    createLoadReportEffect(actions$, api, {}, (action) => store.dispatch(action)),
  { functional: true }
);

export const retryBackoffEffects = {
  loadReportEffect
};