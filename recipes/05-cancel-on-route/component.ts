import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { CancelOnRouteActions } from './actions';
import { CancelOnRouteApi } from './api';
import { selectCancelOnRouteVm } from './selectors';

@Component({
  selector: 'recipe-cancel-on-route',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <section class="recipe-page">
      <h2>05 Cancellation on route change</h2>
      <p>
        Component teardown does not cancel app-scoped effects. This route shows cancellation with
        router events and with an explicit action.
      </p>

      <div class="panel-grid">
        <article class="panel">
          <h3>Route-scoped request</h3>
          <div class="toolbar">
            <button type="button" (click)="loadRouteScoped('123')">Load slow order 123</button>
            <button type="button" (click)="loadRouteScoped('456')">Load fast order 456</button>
          </div>
        </article>

        <article class="panel">
          <h3>Explicit cancellation</h3>
          <div class="toolbar">
            <button type="button" (click)="loadExplicit('123')">Load cancellable order</button>
            <button type="button" class="secondary" (click)="cancel()">Cancel</button>
            <button type="button" class="danger" (click)="failNext()">Fail next</button>
          </div>
        </article>
      </div>

      <button type="button" class="secondary" (click)="reset()">Reset</button>
      <pre class="state-dump">{{ vm() | json }}</pre>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CancelOnRouteComponent {
  private readonly store = inject(Store);
  private readonly api = inject(CancelOnRouteApi);

  readonly vm = this.store.selectSignal(selectCancelOnRouteVm);

  loadRouteScoped(id: string): void {
    this.store.dispatch(CancelOnRouteActions.loadOrder({ id }));
  }

  loadExplicit(id: string): void {
    this.store.dispatch(CancelOnRouteActions.loadOrderWithExplicitCancel({ id }));
  }

  cancel(): void {
    this.store.dispatch(CancelOnRouteActions.cancelLoadOrder());
  }

  failNext(): void {
    this.api.failNext();
  }

  reset(): void {
    this.store.dispatch(CancelOnRouteActions.resetDemo());
  }
}