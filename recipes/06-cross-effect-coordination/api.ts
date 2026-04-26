import { Injectable } from '@angular/core';
import { Observable, mergeMap, of, throwError, timer } from 'rxjs';

import { CoordinationPattern, CurrentUser, DashboardSummary } from './actions';

@Injectable({ providedIn: 'root' })
export class CoordinationApi {
  private failNextUserRequest = false;
  private failNextDashboardRequest = false;

  failNextUser(): void {
    this.failNextUserRequest = true;
  }

  failNextDashboard(): void {
    this.failNextDashboardRequest = true;
  }

  loadCurrentUser(): Observable<CurrentUser> {
    const shouldFail = this.failNextUserRequest;
    this.failNextUserRequest = false;

    return timer(250).pipe(
      mergeMap(() =>
        shouldFail
          ? throwError(() => new Error('Current user failed'))
          : of({ id: 'user-1', name: 'Maya Chen', tenantId: 'tenant-acme' })
      )
    );
  }

  loadDashboard(tenantId: string, pattern: CoordinationPattern): Observable<DashboardSummary> {
    const shouldFail = this.failNextDashboardRequest;
    this.failNextDashboardRequest = false;

    return timer(300).pipe(
      mergeMap(() =>
        shouldFail
          ? throwError(() => new Error('Dashboard failed'))
          : of({ tenantId, revenue: 128_000, openTickets: 7, pattern })
      )
    );
  }
}