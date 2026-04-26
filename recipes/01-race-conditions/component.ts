import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';

import { RaceConditionsActions } from './actions';
import { RaceConditionsApi } from './api';
import { selectRaceConditionsVm } from './selectors';

@Component({
  selector: 'recipe-race-conditions',
  standalone: true,
  imports: [FormsModule, JsonPipe],
  template: `
    <section class="recipe-page">
      <h2>01 Race conditions & flattening operators</h2>
      <p>
        The same async pressure, four operators: cancel stale reads, queue ordered writes,
        parallelize independent work, and ignore duplicate submits.
      </p>

      <div class="panel-grid">
        <article class="panel">
          <h3>switchMap search</h3>
          <input [(ngModel)]="searchQuery" aria-label="Search query" />
          <div class="toolbar">
            <button type="button" (click)="search()">Search</button>
            <button type="button" class="secondary" (click)="searchFast()">Fire stale + fresh</button>
            <button type="button" class="danger" (click)="failNext('search')">Fail next</button>
          </div>
        </article>

        <article class="panel">
          <h3>concatMap draft save</h3>
          <input [(ngModel)]="draftContent" aria-label="Draft content" />
          <div class="toolbar">
            <button type="button" (click)="saveDraft()">Save draft</button>
            <button type="button" class="secondary" (click)="queueDrafts()">Queue two</button>
            <button type="button" class="danger" (click)="failNext('draft')">Fail next</button>
          </div>
        </article>

        <article class="panel">
          <h3>exhaustMap submit</h3>
          <div class="toolbar">
            <button type="button" (click)="submitPayment()">Submit payment</button>
            <button type="button" class="secondary" (click)="doubleSubmit()">Double click</button>
            <button type="button" class="danger" (click)="failNext('payment')">Fail next</button>
          </div>
        </article>

        <article class="panel">
          <h3>mergeMap uploads</h3>
          <input [(ngModel)]="fileName" aria-label="Avatar file name" />
          <div class="toolbar">
            <button type="button" (click)="uploadAvatar()">Upload</button>
            <button type="button" class="secondary" (click)="parallelUploads()">Upload three</button>
            <button type="button" class="danger" (click)="failNext('upload')">Fail next</button>
          </div>
        </article>
      </div>

      <button type="button" class="secondary" (click)="reset()">Reset</button>
      <pre class="state-dump">{{ vm() | json }}</pre>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RaceConditionsComponent {
  private readonly store = inject(Store);
  private readonly api = inject(RaceConditionsApi);

  readonly vm = this.store.selectSignal(selectRaceConditionsVm);
  searchQuery = 'al';
  draftContent = 'first draft';
  fileName = 'avatar.png';

  search(): void {
    this.store.dispatch(RaceConditionsActions.searchUsers({ query: this.searchQuery }));
  }

  searchFast(): void {
    this.store.dispatch(RaceConditionsActions.searchUsers({ query: 'al' }));
    this.store.dispatch(RaceConditionsActions.searchUsers({ query: 'alex' }));
  }

  saveDraft(): void {
    this.store.dispatch(RaceConditionsActions.saveDraft({ content: this.draftContent }));
  }

  queueDrafts(): void {
    this.store.dispatch(RaceConditionsActions.saveDraft({ content: 'slow draft' }));
    this.store.dispatch(RaceConditionsActions.saveDraft({ content: 'final draft' }));
  }

  submitPayment(): void {
    this.store.dispatch(RaceConditionsActions.submitPayment({ amount: 42 }));
  }

  doubleSubmit(): void {
    this.submitPayment();
    this.submitPayment();
  }

  uploadAvatar(): void {
    this.store.dispatch(RaceConditionsActions.uploadAvatar({ fileName: this.fileName }));
  }

  parallelUploads(): void {
    ['avatar-a.png', 'avatar-b.png', 'avatar-c.png'].forEach((fileName) =>
      this.store.dispatch(RaceConditionsActions.uploadAvatar({ fileName }))
    );
  }

  failNext(operation: 'search' | 'draft' | 'payment' | 'upload'): void {
    this.api.failNext(operation);
  }

  reset(): void {
    this.store.dispatch(RaceConditionsActions.resetDemo());
  }
}