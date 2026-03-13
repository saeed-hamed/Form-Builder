import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormService } from '../services/form.service';
import { Form } from '../models/api.models';

@Component({
  selector: 'app-form-catalog',
  standalone: true,
  imports: [RouterLink, TranslocoPipe],
  template: `
    <div class="catalog-page">
      <div class="catalog-header">
        <div>
          <h1 class="catalog-title">{{ 'catalog.title' | transloco }}</h1>
          <p class="catalog-subtitle">{{ 'catalog.subtitle' | transloco }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="catalog-loading">
          <div class="spinner"></div>
          <span>{{ 'catalog.loading' | transloco }}</span>
        </div>
      } @else if (forms().length === 0) {
        <div class="catalog-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>{{ 'catalog.empty' | transloco }}</p>
          <span>{{ 'catalog.emptyHint' | transloco }}</span>
        </div>
      } @else {
        <div class="catalog-grid">
          @for (form of forms(); track form.formId) {
            <a [routerLink]="['/submit', form.formId]" class="form-card">
              <div class="form-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div class="form-card-body">
                <h3 class="form-card-title">{{ form.title }}</h3>
                <p class="form-card-meta">{{ 'catalog.published' | transloco }}</p>
              </div>
              <div class="form-card-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .catalog-page {
      padding: 1.5rem 2rem;
      max-width: 860px;
    }

    .catalog-header {
      margin-bottom: 1.75rem;
    }

    .catalog-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--tx);
      letter-spacing: -0.02em;
      margin: 0 0 0.25rem;
    }

    .catalog-subtitle {
      font-size: 0.8125rem;
      color: var(--tx4);
      margin: 0;
    }

    .catalog-loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 4rem;
      color: var(--tx4);
      font-size: 0.9rem;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--bd);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .catalog-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 4rem 2rem;
      color: #94a3b8;
      text-align: center;
    }

    .catalog-empty p { font-size: 1rem; font-weight: 500; color: #64748b; margin: 0.5rem 0 0; }
    .catalog-empty span { font-size: 0.8125rem; }

    .catalog-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .form-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--sf);
      border: 1px solid var(--bd);
      border-radius: 12px;
      text-decoration: none;
      transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .form-card:hover {
      border-color: #10b981;
      box-shadow: 0 4px 16px rgba(16,185,129,0.12);
      transform: translateY(-1px);
    }

    .form-card-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: rgba(16,185,129,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
      flex-shrink: 0;
    }

    .form-card-body {
      flex: 1;
    }

    .form-card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--tx);
      margin: 0 0 0.2rem;
    }

    .form-card-meta {
      font-size: 0.75rem;
      color: var(--tx4);
      margin: 0;
    }

    .form-card-arrow {
      color: var(--tx3);
      transition: color 0.15s;
    }

    .form-card:hover .form-card-arrow { color: #10b981; }
  `]
})
export class FormCatalogComponent implements OnInit {
  private formService = inject(FormService);

  forms = signal<Form[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loading.set(true);
    this.formService.getAll().subscribe({
      next: data => {
        // Only show forms that have a published version
        this.forms.set(data.filter(f => f.activeVersionId !== null));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
