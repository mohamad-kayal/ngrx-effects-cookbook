import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const recipeLinks = [
  { path: '/race-conditions', label: '01 Race conditions', summary: 'Flattening operators' },
  { path: '/retry-backoff', label: '02 Retry backoff', summary: 'Jitter and retry state' },
  { path: '/optimistic-rollback', label: '03 Optimistic rollback', summary: 'Concurrent updates' },
  { path: '/polling-lifecycle', label: '04 Polling lifecycle', summary: 'Visibility and hard stops' },
  { path: '/cancel-on-route', label: '05 Cancel on route', summary: 'Router scoped requests' },
  { path: '/cross-effect-coordination', label: '06 Coordination', summary: 'Ready selectors and pivots' },
  { path: '/debounce-input', label: '07 Debounce input', summary: 'Typing, loading, retry' },
  { path: '/long-running-progress', label: '08 Progress', summary: 'Streaming job events' }
];

const projectStats = [
  { label: '8 recipes', value: 'feature slices' },
  { label: '36 specs', value: 'timing checks' },
  { label: 'Angular 21', value: 'functional effects' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="app-header">
      <div class="title-block">
        <p class="eyebrow">ngrx-effects-cookbook</p>
        <h1>Production-shaped Effects recipes</h1>
        <p class="lede">
          Focused NGRX patterns for cancellation, concurrency, retries, polling, and progress.
        </p>
        <div class="stat-row" aria-label="Project stats">
          @for (stat of projectStats; track stat.label) {
            <span><strong>{{ stat.label }}</strong>{{ stat.value }}</span>
          }
        </div>
      </div>
      <a class="source-link" href="https://github.com/mohamad-kayal/ngrx-effects-cookbook">
        Source
      </a>
    </header>

    <div class="layout">
      <nav aria-label="Recipes">
        @for (recipe of recipeLinks; track recipe.path) {
          <a [routerLink]="recipe.path" routerLinkActive="active" class="recipe-link">
            <span class="recipe-label">{{ recipe.label }}</span>
            <span class="recipe-summary">{{ recipe.summary }}</span>
          </a>
        }
      </nav>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly recipeLinks = recipeLinks;
  readonly projectStats = projectStats;
}