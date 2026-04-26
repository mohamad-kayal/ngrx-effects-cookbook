import { Injectable } from '@angular/core';
import { Observable, fromEvent, map, of, shareReplay, startWith } from 'rxjs';

export type PollingVisibility = 'visible' | 'hidden';

@Injectable({ providedIn: 'root' })
export class PollingVisibilitySource {
  readonly state$: Observable<PollingVisibility> = createVisibilityStream();
}

function createVisibilityStream(): Observable<PollingVisibility> {
  if (typeof document === 'undefined') {
    return of('visible');
  }

  const readVisibility = (): PollingVisibility =>
    document.visibilityState === 'hidden' ? 'hidden' : 'visible';

  return fromEvent(document, 'visibilitychange').pipe(
    map(readVisibility),
    startWith(readVisibility()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}