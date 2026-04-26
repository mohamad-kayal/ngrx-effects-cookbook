import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';

import { DebounceInputActions } from './actions';
import { DebounceInputApi } from './api';
import { selectDebounceInputVm } from './selectors';

@Component({
  selector: 'recipe-debounce-input',
  standalone: true,
  imports: [FormsModule, JsonPipe],
  template: `
    <section class="recipe-page">
      <h2>07 Debouncing user input to an API</h2>
      <p>
        Immediate typing state, delayed loading state, empty-input cancellation, duplicate-query
        suppression, and in-flight request cancellation on the next keystroke.
      </p>

      <article class="panel">
        <h3>Search sandbox</h3>
        <input
          [(ngModel)]="query"
          (ngModelChange)="queryChanged($event)"
          aria-label="Search query"
          placeholder="Type a query"
        />
        <div class="toolbar">
          <button type="button" class="secondary" (click)="typeRapidly()">Type ngrx quickly</button>
          <button type="button" class="danger" (click)="failNext()">Fail next request</button>
          <button type="button" class="secondary" (click)="clear()">Clear</button>
        </div>
      </article>

      <pre class="state-dump">{{ vm() | json }}</pre>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DebounceInputComponent {
  private readonly store = inject(Store);
  private readonly api = inject(DebounceInputApi);

  readonly vm = this.store.selectSignal(selectDebounceInputVm);
  query = '';

  queryChanged(query: string): void {
    this.store.dispatch(DebounceInputActions.searchInput({ query }));
  }

  typeRapidly(): void {
    ['n', 'ng', 'ngr', 'ngrx'].forEach((query) => this.queryChanged(query));
    this.query = 'ngrx';
  }

  failNext(): void {
    this.api.failNext();
  }

  clear(): void {
    this.query = '';
    this.queryChanged('');
  }
}