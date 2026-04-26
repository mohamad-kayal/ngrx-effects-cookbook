import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

const recipeLinks = [
  { path: '/race-conditions', label: '01 Race conditions' },
  { path: '/retry-backoff', label: '02 Retry backoff' },
  { path: '/optimistic-rollback', label: '03 Optimistic rollback' },
  { path: '/polling-lifecycle', label: '04 Polling lifecycle' },
  { path: '/cancel-on-route', label: '05 Cancel on route' },
  { path: '/cross-effect-coordination', label: '06 Coordination' },
  { path: '/debounce-input', label: '07 Debounce input' },
  { path: '/long-running-progress', label: '08 Progress' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="app-header">
      <div>
        <p class="eyebrow">ngrx-effects-cookbook</p>
        <h1>Production-shaped Effects recipes</h1>
      </div>
      <a class="source-link" href="https://github.com/mohamad-kayal/ngrx-effects-cookbook">
        GitHub
      </a>
    </header>

    <div class="layout">
      <nav aria-label="Recipes">
        @for (recipe of recipeLinks; track recipe.path) {
          <a [routerLink]="recipe.path" routerLinkActive="active">{{ recipe.label }}</a>
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
}