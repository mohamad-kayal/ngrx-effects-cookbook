import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { PollingLifecycleActions } from './actions';
import { PollingLifecycleApi } from './api';
import { selectPollingLifecycleVm } from './selectors';

@Component({
  selector: 'recipe-polling-lifecycle',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <section class="recipe-page">
      <h2>04 Polling lifecycles</h2>
      <p>
        A polling effect with start, stop, visibility pause, bounded retry, and hard stops on
        logout or route exit.
      </p>

      <div class="panel">
        <h3>Polling controls</h3>
        <div class="toolbar">
          <button type="button" (click)="start()">Start</button>
          <button type="button" class="secondary" (click)="stop()">Stop</button>
          <button type="button" class="secondary" (click)="logout()">Logout stop</button>
          <button type="button" class="danger" (click)="failNext()">Fail next poll</button>
          <button type="button" class="secondary" (click)="reset()">Reset</button>
        </div>
      </div>

      <pre class="state-dump">{{ vm() | json }}</pre>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PollingLifecycleComponent {
  private readonly store = inject(Store);
  private readonly api = inject(PollingLifecycleApi);

  readonly vm = this.store.selectSignal(selectPollingLifecycleVm);

  start(): void {
    this.store.dispatch(PollingLifecycleActions.startPolling());
  }

  stop(): void {
    this.store.dispatch(PollingLifecycleActions.stopPolling());
  }

  logout(): void {
    this.store.dispatch(PollingLifecycleActions.logout());
  }

  failNext(): void {
    this.api.failNext();
  }

  reset(): void {
    this.store.dispatch(PollingLifecycleActions.resetDemo());
  }
}