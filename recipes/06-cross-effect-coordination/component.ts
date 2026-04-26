import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { CoordinationActions } from './actions';
import { CoordinationApi } from './api';
import { selectCoordinationVm } from './selectors';

@Component({
  selector: 'recipe-cross-effect-coordination',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <section class="recipe-page">
      <h2>06 Cross-effect coordination</h2>
      <p>
        Three ways to let dashboard loading depend on current-user readiness without one effect
        directly calling another effect's logic.
      </p>

      <div class="panel-grid">
        <article class="panel">
          <h3>Pattern A: coordination action</h3>
          <div class="toolbar">
            <button type="button" (click)="loadUser()">Load user</button>
            <button type="button" class="danger" (click)="failUserThenLoad()">Fail user</button>
          </div>
        </article>

        <article class="panel">
          <h3>Pattern B: route pivot</h3>
          <div class="toolbar">
            <button type="button" (click)="enterDashboardRoute()">Dashboard route entered</button>
          </div>
        </article>

        <article class="panel">
          <h3>Pattern C: ready selector</h3>
          <div class="toolbar">
            <button type="button" (click)="requestDashboard()">Request dashboard</button>
            <button type="button" class="danger" (click)="failDashboard()">Fail next dashboard</button>
          </div>
        </article>
      </div>

      <button type="button" class="secondary" (click)="reset()">Reset</button>
      <pre class="state-dump">{{ vm() | json }}</pre>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrossEffectCoordinationComponent {
  private readonly store = inject(Store);
  private readonly api = inject(CoordinationApi);

  readonly vm = this.store.selectSignal(selectCoordinationVm);

  loadUser(): void {
    this.store.dispatch(CoordinationActions.loadCurrentUser());
  }

  failUserThenLoad(): void {
    this.api.failNextUser();
    this.loadUser();
  }

  enterDashboardRoute(): void {
    this.store.dispatch(CoordinationActions.dashboardRouteEntered());
  }

  requestDashboard(): void {
    this.store.dispatch(CoordinationActions.dashboardRequested());
  }

  failDashboard(): void {
    this.api.failNextDashboard();
  }

  reset(): void {
    this.store.dispatch(CoordinationActions.resetDemo());
  }
}