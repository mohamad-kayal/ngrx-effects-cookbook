import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { OptimisticRollbackActions } from './actions';
import { OptimisticRollbackApi } from './api';
import { selectOptimisticRollbackVm } from './selectors';

@Component({
  selector: 'recipe-optimistic-rollback',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <section class="recipe-page">
      <h2>03 Optimistic updates with rollback</h2>
      <p>
        Optimistic reducer updates keyed by correlation ID, with per-entity pending stacks so
        concurrent failures do not clobber newer intent.
      </p>

      <div class="panel-grid">
        @for (flag of vm().flags; track flag.id) {
          <article class="panel">
            <h3>{{ flag.name }}</h3>
            <p>Status: {{ flag.enabled ? 'enabled' : 'disabled' }}</p>
            <div class="toolbar">
              <button type="button" (click)="toggle(flag.id, !flag.enabled)">Toggle</button>
              <button type="button" class="danger" (click)="failNextThenToggle(flag.id, !flag.enabled)">
                Fail next toggle
              </button>
            </div>
          </article>
        }
      </div>

      <div class="toolbar">
        <button type="button" class="secondary" (click)="raceFirstFailure()">
          First fails, second stays visible
        </button>
        <button type="button" class="secondary" (click)="reset()">Reset</button>
      </div>

      <pre class="state-dump">{{ vm() | json }}</pre>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimisticRollbackComponent {
  private readonly store = inject(Store);
  private readonly api = inject(OptimisticRollbackApi);

  readonly vm = this.store.selectSignal(selectOptimisticRollbackVm);

  toggle(id: string, enabled: boolean, correlationId: string = crypto.randomUUID()): void {
    this.store.dispatch(
      OptimisticRollbackActions.toggleFlagOptimistic({ id, enabled, correlationId })
    );
  }

  failNextThenToggle(id: string, enabled: boolean): void {
    this.api.failNext();
    this.toggle(id, enabled, crypto.randomUUID());
  }

  raceFirstFailure(): void {
    this.api.failNext();
    this.toggle('email-alerts', true, 'slow-first');
    this.toggle('email-alerts', false, 'fast-second');
  }

  reset(): void {
    this.store.dispatch(OptimisticRollbackActions.resetDemo());
  }
}