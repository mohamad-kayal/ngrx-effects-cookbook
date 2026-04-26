import { Injectable } from '@angular/core';
import { Observable, mergeMap, of, throwError, timer } from 'rxjs';

import { DraftReceipt, UploadReceipt, UserResult } from './actions';

type Operation = 'search' | 'draft' | 'payment' | 'upload';

@Injectable({ providedIn: 'root' })
export class RaceConditionsApi {
  private readonly failingOperations = new Set<Operation>();
  private draftVersion = 0;

  failNext(operation: Operation): void {
    this.failingOperations.add(operation);
  }

  searchUsers(query: string): Observable<UserResult[]> {
    const latencyMs = query.length <= 2 ? 650 : 180;

    return timer(latencyMs).pipe(
      mergeMap(() =>
        this.takeFailure('search')
          ? throwError(() => new Error('Search failed'))
          : of([
              { id: `${query}-1`, name: `${query} Harper` },
              { id: `${query}-2`, name: `${query} Singh` }
            ])
      )
    );
  }

  saveDraft(content: string): Observable<DraftReceipt> {
    return timer(content.includes('slow') ? 850 : 350).pipe(
      mergeMap(() =>
        this.takeFailure('draft')
          ? throwError(() => new Error('Draft save failed'))
          : of({ version: ++this.draftVersion, content })
      )
    );
  }

  submitPayment(amount: number): Observable<string> {
    return timer(900).pipe(
      mergeMap(() =>
        this.takeFailure('payment')
          ? throwError(() => new Error('Payment failed'))
          : of(`pay_${amount}_${Date.now()}`)
      )
    );
  }

  uploadAvatar(fileName: string): Observable<UploadReceipt> {
    const latencyMs = 220 + fileName.length * 20;

    return timer(latencyMs).pipe(
      mergeMap(() =>
        this.takeFailure('upload')
          ? throwError(() => new Error('Upload failed'))
          : of({ fileName, uploadedAt: new Date().toISOString() })
      )
    );
  }

  private takeFailure(operation: Operation): boolean {
    const shouldFail = this.failingOperations.has(operation);
    this.failingOperations.delete(operation);
    return shouldFail;
  }
}