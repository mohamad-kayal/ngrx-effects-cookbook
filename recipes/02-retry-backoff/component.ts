import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { RetryBackoffActions } from './actions';
import { RetryBackoffApi } from './api';
import { selectRetryBackoffVm } from './selectors';

@Component({
  selector: 'recipe-retry-backoff',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <section class="recipe-page">
      <h2>02 Retry with exponential backoff + jitter</h2>
      <p>
        Modern retry configuration, retryable error classification, capped full jitter, and
        retrying state surfaced to the store.
      </p>

      <div class="panel-grid">
        <article class="panel">
          <h3>Transient backend failures</h3>
          <div class="toolbar">
            <button type="button" (click)="load()">Load report</button>
            <button type="button" class="secondary" (click)="failTwiceThenLoad()">
              Fail twice then load
            </button>
          </div>
        </article>

        <article class="panel">
          <h3>Non-retryable auth failure</h3>
          <div class="toolbar">
            <button type="button" class="danger" (click)="authFailure()">401 then load</button>
            <button type="button" class="secondary" (click)="reset()">Reset</button>
          </div>
        </article>
      </div>

      <pre class="state-dump">{{ vm() | json }}</pre>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RetryBackoffComponent {
  private readonly store = inject(Store);
  private readonly api = inject(RetryBackoffApi);

  readonly vm = this.store.selectSignal(selectRetryBackoffVm);

  load(): void {
    this.store.dispatch(RetryBackoffActions.loadReport());
  }

  failTwiceThenLoad(): void {
    this.api.failNextSequence([503, 502]);
    this.load();
  }

  authFailure(): void {
    this.api.failNextWith(401, 'Token expired');
    this.load();
  }

  reset(): void {
    this.store.dispatch(RetryBackoffActions.resetDemo());
  }
}