import { Injectable } from '@angular/core';
import { Observable, mergeMap, of, throwError, timer } from 'rxjs';

import { OrderDetails } from './actions';

@Injectable({ providedIn: 'root' })
export class CancelOnRouteApi {
  private failNextRequest = false;

  failNext(): void {
    this.failNextRequest = true;
  }

  fetchOrder(id: string): Observable<OrderDetails> {
    const shouldFail = this.failNextRequest;
    this.failNextRequest = false;
    const latencyMs = id === '123' ? 1_000 : 350;

    return timer(latencyMs).pipe(
      mergeMap(() =>
        shouldFail
          ? throwError(() => new Error(`Order ${id} failed`))
          : of({ id, customer: id === '123' ? 'Ada Lovelace' : 'Grace Hopper', total: id === '123' ? 140 : 220 })
      )
    );
  }
}