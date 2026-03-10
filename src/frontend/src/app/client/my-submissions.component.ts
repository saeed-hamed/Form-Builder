import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubmissionService } from '../services/submission.service';
import { FormService } from '../services/form.service';
import { VersionService } from '../services/version.service';
import { SubmissionResponse, Form, Field } from '../models/api.models';

@Component({
  selector: 'app-my-submissions',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="subs-page">
      <div class="subs-header">
        <div>
          <h1 class="subs-title">Submitted Forms</h1>
          <p class="subs-subtitle">All form submissions across the platform</p>
        </div>
        <a routerLink="/submit" class="btn-new">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Submit a Form
        </a>
      </div>

      @if (loading()) {
        <div class="subs-loading">
          <div class="spinner"></div>
          <span>Loading submissions…</span>
        </div>
      } @else if (submissions().length === 0) {
        <div class="subs-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p>No submissions yet.</p>
          <a routerLink="/submit" class="empty-link">Submit your first form →</a>
        </div>
      } @else {
        <div class="subs-list">
          @for (sub of submissions(); track sub.submissionId) {
            <div class="sub-card" [class.has-tasks]="sub.generatedTasks.length > 0" [class.is-expanded]="expandedId() === sub.submissionId">
              <div class="sub-card-main" (click)="toggleExpand(sub.submissionId)" style="cursor:pointer">
                <div class="sub-info">
                  <div class="sub-form-title">{{ formTitleFor(sub) }}</div>
                  <div class="sub-meta">
                    <span class="sub-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {{ sub.submittedBy }}
                    </span>
                    <span class="sub-meta-dot">·</span>
                    <span class="sub-meta-item">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {{ formatDate(sub.submittedAt) }}
                    </span>
                    <span class="sub-meta-dot">·</span>
                    <span class="sub-meta-item">{{ sub.values.length }} field{{ sub.values.length !== 1 ? 's' : '' }}</span>
                  </div>
                </div>

                <div class="sub-badges">
                  @if (sub.generatedTasks.length > 0) {
                    <span class="badge badge-tasks">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 11 12 14 22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                      {{ sub.generatedTasks.length }} task{{ sub.generatedTasks.length !== 1 ? 's' : '' }}
                    </span>
                  }
                  <span class="badge badge-id">#{{ sub.submissionId }}</span>
                  <span class="expand-chevron" [class.open]="expandedId() === sub.submissionId">
                    <span class="expand-label">{{ expandedId() === sub.submissionId ? 'Hide' : 'View Details' }}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </div>
              </div>

              @if (sub.generatedTasks.length > 0) {
                <div class="sub-tasks">
                  @for (task of sub.generatedTasks; track task.submissionTaskId) {
                    <span class="task-pill" [class]="'task-pill--' + statusClass(task.status)">
                      {{ task.taskName }}
                      <span class="task-pill-status">{{ task.status }}</span>
                    </span>
                  }
                </div>
              }

              @if (expandedId() === sub.submissionId) {
                <div class="sub-detail">
                  <div class="sub-detail-header">Submitted Values</div>
                  <div class="sub-detail-grid">
                    @for (row of mergedFields(sub); track row.fieldKey) {
                      <div class="sub-detail-row">
                        <span class="sub-detail-key">{{ fieldLabel(row.fieldKey) }}</span>
                        <span class="sub-detail-val" [class.sub-detail-empty-val]="!row.value">
                          {{ row.value || '—' }}
                        </span>
                      </div>
                    }
                    @if (mergedFields(sub).length === 0) {
                      <p class="sub-detail-empty">Loading fields…</p>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .subs-page {
      padding: 1.5rem 2rem;
      max-width: 860px;
    }

    .subs-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .subs-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0 0 0.25rem;
    }

    .subs-subtitle {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
    }

    .btn-new {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .subs-loading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 4rem;
      color: #64748b;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .subs-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 4rem 2rem;
      color: #94a3b8;
      text-align: center;
    }

    .subs-empty p { font-size: 1rem; font-weight: 500; color: #64748b; margin: 0.5rem 0 0; }

    .empty-link {
      color: #3b82f6;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .subs-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .sub-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: border-color 0.15s;
    }

    .sub-card.has-tasks { border-left: 3px solid #f59e0b; }

    .sub-card-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .sub-form-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .sub-meta {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .sub-meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .sub-meta-item svg { opacity: 0.7; }
    .sub-meta-dot { color: #cbd5e1; font-size: 0.75rem; }

    .sub-badges {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .badge {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
    }

    .badge-tasks { background: #fef3c7; color: #92400e; }
    .badge-id { background: #f1f5f9; color: #475569; }

    .sub-tasks {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.625rem;
      padding-top: 0.625rem;
      border-top: 1px solid #f1f5f9;
    }

    .task-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.625rem;
      border-radius: 99px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #374151;
    }

    .task-pill-status {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .task-pill--pending .task-pill-status { background: #fef3c7; color: #92400e; }
    .task-pill--inprogress .task-pill-status { background: #dbeafe; color: #1e40af; }
    .task-pill--completed .task-pill-status { background: #dcfce7; color: #14532d; }

    .expand-chevron {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.6rem 0.3rem 0.75rem;
      border-radius: 6px;
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      flex-shrink: 0;
    }
    .expand-chevron svg {
      transition: transform 0.2s;
      flex-shrink: 0;
    }
    .expand-chevron:hover {
      background: #dbeafe;
      color: #3b82f6;
      border-color: #bfdbfe;
    }
    .expand-chevron.open {
      background: #dbeafe;
      color: #2563eb;
      border-color: #93c5fd;
    }
    .expand-chevron.open svg { transform: rotate(180deg); }

    .expand-label {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .sub-detail {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }

    .sub-detail-header {
      font-size: 0.7rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-bottom: 0.5rem;
    }

    .sub-detail-grid {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .sub-detail-row {
      display: flex;
      gap: 0.75rem;
      font-size: 0.8125rem;
      padding: 0.3rem 0.5rem;
      border-radius: 6px;
      background: #f8fafc;
    }

    .sub-detail-key {
      font-weight: 500;
      color: #475569;
      min-width: 160px;
      flex-shrink: 0;
    }

    .sub-detail-val {
      color: #0f172a;
      word-break: break-word;
    }

    .sub-detail-empty { font-size: 0.8125rem; color: #94a3b8; margin: 0; }
    .sub-detail-empty-val { color: #94a3b8; font-style: italic; }

    .sub-card.is-expanded {
      border-color: #bfdbfe;
      box-shadow: 0 2px 8px rgba(59,130,246,0.08);
    }
  `]
})
export class MySubmissionsComponent implements OnInit {
  private submissionService = inject(SubmissionService);
  private formService = inject(FormService);
  private versionService = inject(VersionService);

  submissions = signal<SubmissionResponse[]>([]);
  formsMap = signal<Record<number, string>>({});
  fieldsCache = signal<Record<number, Field[]>>({});
  loading = signal(false);
  expandedId = signal<number | null>(null);

  ngOnInit() {
    this.loading.set(true);
    let done = 0;
    const check = () => { if (++done === 2) this.loading.set(false); };

    this.submissionService.getAll().subscribe({
      next: data => { this.submissions.set(data); check(); },
      error: () => check()
    });

    this.formService.getAll().subscribe({
      next: forms => {
        const map: Record<number, string> = {};
        for (const f of forms) map[f.formId] = f.title;
        this.formsMap.set(map);
        check();
      },
      error: () => check()
    });
  }

  formTitleFor(sub: SubmissionResponse): string {
    return this.formsMap()[sub.formId] ?? `Form #${sub.formId}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  statusClass(status: string): string {
    if (status === 'In Progress') return 'inprogress';
    return status.toLowerCase();
  }

  toggleExpand(id: number) {
    this.expandedId.update(current => current === id ? null : id);
    if (this.expandedId() === id) {
      const sub = this.submissions().find(s => s.submissionId === id);
      if (sub && !this.fieldsCache()[sub.formVersionId]) {
        this.versionService.getFields(sub.formVersionId).subscribe({
          next: fields => this.fieldsCache.update(c => ({ ...c, [sub.formVersionId]: fields })),
          error: () => {}
        });
      }
    }
  }

  mergedFields(sub: SubmissionResponse): { fieldKey: string; value: string }[] {
    const fields = this.fieldsCache()[sub.formVersionId];
    const valMap: Record<string, string> = {};
    for (const v of sub.values) valMap[v.fieldKey] = v.value;

    if (!fields) return sub.values.map(v => ({ fieldKey: v.fieldKey, value: v.value }));

    return [...fields]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(f => ({ fieldKey: f.fieldKey, value: valMap[f.fieldKey] ?? '' }));
  }

  fieldLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
