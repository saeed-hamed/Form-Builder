import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { VersionService } from '../../services/version.service';
import { FormVersion } from '../../models/api.models';
import { FieldsTabComponent } from './fields-tab/fields-tab.component';
import { RulesTabComponent } from './rules-tab/rules-tab.component';
import { TriggersTabComponent } from './triggers-tab/triggers-tab.component';

type Tab = 'fields' | 'rules' | 'triggers';

@Component({
  selector: 'app-version-editor',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, FieldsTabComponent, RulesTabComponent, TriggersTabComponent],
  template: `
    <div class="page">
      @if (loading()) {
        <p class="text-muted">{{ 'common.loading' | transloco }}</p>
      } @else if (version()) {
        <!-- Breadcrumb -->
        <div style="font-size:0.85rem;color:var(--tx4);margin-bottom:1rem">
          <a routerLink="/forms" style="color:var(--tx4);text-decoration:none">Forms</a>
          <span> / </span>
          <a [routerLink]="['/forms', formId()]" style="color:var(--tx4);text-decoration:none">
            Form {{ formId() }}
          </a>
          <span> / v{{ version()!.versionNumber }}</span>
        </div>

        <!-- Header -->
        <div class="page-header">
          <div>
            <h1>Version {{ version()!.versionNumber }}</h1>
            <div style="margin-top:0.25rem">
              @if (version()!.published) {
                <span class="badge badge-green">{{ 'editor.published' | transloco }}</span>
              } @else {
                <span class="badge badge-yellow">{{ 'editor.draft' | transloco }}</span>
              }
            </div>
          </div>
          @if (!version()!.published) {
            <button class="btn-primary" (click)="publish()">{{ 'editor.publishVersion' | transloco }}</button>
          }
        </div>

        @if (version()!.published) {
          <p class="error" style="background:var(--warn-bg);border-color:var(--warn-border);color:var(--warn-color);margin-bottom:1rem">
            {{ 'editor.publishedWarning' | transloco }}
          </p>
        }

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'fields'" (click)="activeTab.set('fields')">
            {{ 'editor.fields' | transloco }}
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'rules'" (click)="activeTab.set('rules')">
            {{ 'editor.conditionalRules' | transloco }}
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'triggers'" (click)="activeTab.set('triggers')">
            {{ 'editor.taskTriggers' | transloco }}
          </button>
        </div>

        <!-- Tab content -->
        @if (activeTab() === 'fields') {
          <app-fields-tab [versionId]="versionId()" />
        }
        @if (activeTab() === 'rules') {
          <app-rules-tab [versionId]="versionId()" />
        }
        @if (activeTab() === 'triggers') {
          <app-triggers-tab [versionId]="versionId()" />
        }
      }
    </div>
  `
})
export class VersionEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private versionService = inject(VersionService);

  version = signal<FormVersion | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<Tab>('fields');
  formId = signal(0);
  versionId = signal(0);

  ngOnInit() {
    const fId = Number(this.route.snapshot.paramMap.get('formId'));
    const vId = Number(this.route.snapshot.paramMap.get('versionId'));
    this.formId.set(fId);
    this.versionId.set(vId);
    this.load(fId, vId);
  }

  load(formId: number, versionId: number) {
    this.loading.set(true);
    this.versionService.getVersion(formId, versionId).subscribe({
      next: v => { this.version.set(v); this.loading.set(false); },
      error: () => { this.error.set('Failed to load version'); this.loading.set(false); }
    });
  }

  publish() {
    if (!confirm('Publish this version? It will become the active version for this form.')) return;
    this.versionService.publishVersion(this.formId(), this.versionId()).subscribe({
      next: () => this.version.update(v => v ? { ...v, published: true } : v),
      error: () => this.error.set('Failed to publish')
    });
  }
}
