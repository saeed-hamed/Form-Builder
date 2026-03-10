import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormService } from '../../services/form.service';
import { VersionService } from '../../services/version.service';
import { Form } from '../../models/api.models';
import { FieldsTabComponent } from '../version-editor/fields-tab/fields-tab.component';
import { RulesTabComponent } from '../version-editor/rules-tab/rules-tab.component';
import { TriggersTabComponent } from '../version-editor/triggers-tab/triggers-tab.component';
import { FormPreviewComponent } from '../form-preview/form-preview.component';

@Component({
  selector: 'app-form-editor',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FieldsTabComponent,
    RulesTabComponent,
    TriggersTabComponent,
    FormPreviewComponent
  ],
  template: `
    <!-- Sticky top bar -->
    <div class="fe-header">
      <a routerLink="/forms" class="fe-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Forms
      </a>
      <span class="fe-sep">/</span>

      @if (editingTitle()) {
        <form [formGroup]="titleFg" (ngSubmit)="saveTitle()" class="fe-title-form">
          <input formControlName="title" class="fe-title-input" />
          <button type="submit" class="btn-primary btn-sm" [disabled]="titleFg.invalid">Save</button>
          <button type="button" class="btn-secondary btn-sm" (click)="editingTitle.set(false)">Cancel</button>
        </form>
      } @else {
        <span class="fe-title" (click)="startEditTitle()" title="Click to rename">
          {{ form()?.title ?? '…' }}
        </span>
        <button class="fe-edit-btn" (click)="startEditTitle()" title="Rename form">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      }

      @if (titleError()) {
        <span class="fe-header-error">{{ titleError() }}</span>
      }

      <div class="fe-header-actions">
        <button class="btn-secondary btn-sm" (click)="bumpPreview()">
          ↻ Refresh Preview
        </button>
      </div>
    </div>

    @if (booting()) {
      <div style="padding:3rem 2rem">
        <p class="text-muted">Setting up form…</p>
      </div>
    } @else if (versionId() > 0) {
      <div class="fe-body">

        <!-- LEFT: editor sections -->
        <div class="fe-left">

          <!-- Fields -->
          <div class="fe-section">
            <div class="fe-section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              Fields
            </div>
            <app-fields-tab [versionId]="versionId()" />
          </div>

          <!-- Conditional Rules -->
          <div class="fe-section">
            <div class="fe-section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Conditional Rules
            </div>
            <app-rules-tab [versionId]="versionId()" />
          </div>

          <!-- Task Triggers -->
          <div class="fe-section">
            <div class="fe-section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Task Triggers
            </div>
            <app-triggers-tab [versionId]="versionId()" />
          </div>

        </div>

        <!-- RIGHT: sticky live preview -->
        <div class="fe-right">
          <app-form-preview
            [versionId]="versionId()"
            [formTitle]="form()?.title ?? ''"
            [refreshKey]="previewKey()"
          />
        </div>

      </div>
    }
  `
})
export class FormEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private formService = inject(FormService);
  private versionService = inject(VersionService);
  private fb = inject(FormBuilder);

  form = signal<Form | null>(null);
  formId = signal(0);
  versionId = signal(0);
  booting = signal(true);
  titleError = signal<string | null>(null);
  editingTitle = signal(false);
  previewKey = signal(0);

  titleFg = this.fb.group({ title: ['', Validators.required] });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('formId'));
    this.formId.set(id);
    this.boot(id);
  }

  private boot(formId: number) {
    this.booting.set(true);
    this.formService.getById(formId).subscribe({
      next: f => {
        this.form.set(f);
        if (f.activeVersionId) {
          this.versionId.set(f.activeVersionId);
          this.booting.set(false);
        } else {
          this.autoCreateVersion(formId);
        }
      },
      error: () => {
        this.titleError.set('Failed to load form');
        this.booting.set(false);
      }
    });
  }

  private autoCreateVersion(formId: number) {
    this.versionService.createVersion(formId).subscribe({
      next: v => {
        this.versionService.publishVersion(formId, v.versionId).subscribe({
          next: () => {
            this.versionId.set(v.versionId);
            this.form.update(f => f ? { ...f, activeVersionId: v.versionId } : f);
            this.booting.set(false);
          },
          error: () => {
            // Publish failed but we still have a version to work with
            this.versionId.set(v.versionId);
            this.booting.set(false);
          }
        });
      },
      error: () => {
        this.titleError.set('Could not initialise form — please refresh');
        this.booting.set(false);
      }
    });
  }

  startEditTitle() {
    this.titleFg.patchValue({ title: this.form()!.title });
    this.editingTitle.set(true);
    this.titleError.set(null);
  }

  saveTitle() {
    if (this.titleFg.invalid) return;
    const title = this.titleFg.value.title!;
    this.formService.update(this.formId(), title).subscribe({
      next: () => {
        this.form.update(f => f ? { ...f, title } : f);
        this.editingTitle.set(false);
      },
      error: () => this.titleError.set('Failed to save title')
    });
  }

  bumpPreview() {
    this.previewKey.update(k => k + 1);
  }
}
