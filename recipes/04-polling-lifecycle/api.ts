import { Injectable } from '@angular/core';
import { Observable, mergeMap, of, throwError, timer } from 'rxjs';

import { PollSample } from './actions';

@Injectable({ providedIn: 'root' })
export class PollingLifecycleApi {
  private failNextRequest = false;
  private activeUsers = 42;

  failNext(): void {
    this.failNextRequest = true;
  }

  fetchStatus(): Observable<PollSample> {
    const shouldFail = this.failNextRequest;
    this.failNextRequest = false;

    return timer(180).pipe(
      mergeMap(() => {
        if (shouldFail) {
          return throwError(() => new Error('Polling endpoint failed'));
        }

        this.activeUsers += Math.random() > 0.5 ? 1 : -1;
        return of({ activeUsers: this.activeUsers, fetchedAt: new Date().toISOString() });
      })
    );
  }
}