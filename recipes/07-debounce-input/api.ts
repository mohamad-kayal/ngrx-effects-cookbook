import { Injectable } from '@angular/core';
import { Observable, mergeMap, of, throwError, timer } from 'rxjs';

import { SearchResult } from './actions';

@Injectable({ providedIn: 'root' })
export class DebounceInputApi {
  private failNextRequest = false;

  failNext(): void {
    this.failNextRequest = true;
  }

  search(query: string): Observable<SearchResult[]> {
    const shouldFail = this.failNextRequest;
    this.failNextRequest = false;

    return timer(450).pipe(
      mergeMap(() =>
        shouldFail
          ? throwError(() => new Error(`Search failed for ${query}`))
          : of([
              { id: `${query}-docs`, label: `${query} docs` },
              { id: `${query}-issues`, label: `${query} issues` }
            ])
      )
    );
  }
}