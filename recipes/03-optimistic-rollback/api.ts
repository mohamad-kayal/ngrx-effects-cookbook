import { Injectable } from '@angular/core';
import { Observable, mergeMap, of, throwError, timer } from 'rxjs';

import { FeatureFlag } from './actions';

@Injectable({ providedIn: 'root' })
export class OptimisticRollbackApi {
  private failNextRequest = false;

  failNext(): void {
    this.failNextRequest = true;
  }

  updateFlag(id: string, enabled: boolean, correlationId: string): Observable<FeatureFlag> {
    const shouldFail = this.failNextRequest;
    this.failNextRequest = false;

    return timer(correlationId.includes('slow') ? 800 : 350).pipe(
      mergeMap(() =>
        shouldFail
          ? throwError(() => new Error(`Rejected ${correlationId}`))
          : of({ id, name: labelForFlag(id), enabled })
      )
    );
  }
}

function labelForFlag(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}