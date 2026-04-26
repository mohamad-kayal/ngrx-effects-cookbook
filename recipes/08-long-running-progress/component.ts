import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { LongRunningProgressActions } from './actions';
import { selectLongRunningProgressVm } from './selectors';

@Component({
  selector: 'recipe-long-running-progress',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <section class="recipe-page">
      <h2>08 Long-running tasks with progress</h2>
      <p>
        A simulated server-pushed progress stream feeding the store, with success, failure,
        cancellation, route exit, and finalization paths.
      </p>

      <article class="panel">
        <h3>Report generation job</h3>
        <div class="toolbar">
          <button type="button" (click)="start()">Start job</button>
          <button type="button" class="danger" (click)="startFailing()">Start failing job</button>
          <button type="button" class="secondary" (click)="cancel()" [disabled]="!vm().isRunning">
            Cancel
          </button>
          <button type="button" class="secondary" (click)="logout()">Logout</button>
          <button type="button" class="secondary" (click)="reset()">Reset</button>
        </div>
      </article>

      <pre class="state-dump">{{ vm() | json }}</pre>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LongRunningProgressComponent {
  private readonly store = inject(Store);

  readonly vm = this.store.selectSignal(selectLongRunningProgressVm);

  start(): void {
    this.store.dispatch(LongRunningProgressActions.startJob({ jobId: crypto.randomUUID() }));
  }

  startFailing(): void {
    this.store.dispatch(
      LongRunningProgressActions.startJob({ jobId: crypto.randomUUID(), failAtStep: 4 })
    );
  }

  cancel(): void {
    const jobId = this.vm().jobId;

    if (jobId) {
      this.store.dispatch(LongRunningProgressActions.cancelJob({ jobId }));
    }
  }

  logout(): void {
    this.store.dispatch(LongRunningProgressActions.logout());
  }

  reset(): void {
    this.store.dispatch(LongRunningProgressActions.resetDemo());
  }
}