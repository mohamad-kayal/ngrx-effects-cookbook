import { Injectable } from '@angular/core';
import { Observable, mergeMap, of, throwError, timer } from 'rxjs';

import { HttpLikeError, ReportSummary } from './actions';

@Injectable({ providedIn: 'root' })
export class RetryBackoffApi {
  private readonly queuedFailures: HttpLikeError[] = [];

  failNextWith(status: number, message = `HTTP ${status}`): void {
    this.queuedFailures.push({ status, message });
  }

  failNextSequence(statuses: number[]): void {
    statuses.forEach((status) => this.failNextWith(status));
  }

  loadReport(): Observable<ReportSummary> {
    return timer(250).pipe(
      mergeMap(() => {
        const nextFailure = this.queuedFailures.shift();

        if (nextFailure) {
          return throwError(() => nextFailure);
        }

        return of({
          id: 'daily-revenue',
          title: 'Daily revenue snapshot',
          generatedAt: new Date().toISOString()
        });
      })
    );
  }
}