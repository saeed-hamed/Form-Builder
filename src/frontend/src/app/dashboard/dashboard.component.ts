import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormService } from '../services/form.service';
import { LookupService } from '../services/lookup.service';
import { TaskDefinitionService } from '../services/task-definition.service';
import { TaskBoardService } from '../services/task-board.service';
import { TrustHtmlPipe } from '../pipes/safe-html.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TrustHtmlPipe],
  template: `
    <div class="dash">

      <!-- Page header -->
      <div class="page-header">
        <div class="page-header-text">
          <h1 class="page-title">Welcome back</h1>
          <p class="page-date">{{ today }}</p>
        </div>
        <a routerLink="/submit" class="cta-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Submit a Form
        </a>
      </div>

      <!-- How It Works (pinned near top) -->
      <section class="section flow-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">How It Works</h2>
            <p class="section-sub">The automated workflow from form creation to task generation</p>
          </div>
        </div>

        <div class="flow-card">
          <div class="flow-steps">
            @for (step of steps; track step.num; let last = $last) {
              <div class="flow-step" [style]="'--sc:' + step.color + ';--sb:' + step.bg + ';animation-delay:' + (step.num * 0.1) + 's'">
                <div class="step-badge" [style.background]="step.color">{{ step.num }}</div>
                <div class="step-icon-wrap" [style.background]="step.bg" [style.color]="step.color">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="step.iconPath | trustHtml"></svg>
                </div>
                <div class="step-label">{{ step.label }}</div>
                <div class="step-desc">{{ step.desc }}</div>
              </div>
              @if (!last) {
                <div class="flow-connector">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--bdi)">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              }
            }
          </div>
        </div>
      </section>

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card" style="--c:#3b82f6;--bg:rgba(59,130,246,0.12);--cb:rgba(59,130,246,0.3)">
          <div class="stat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="stat-value">{{ loading() ? '—' : stats().forms }}</div>
          <div class="stat-label">Form Templates</div>
        </div>

        <div class="stat-card" style="--c:#8b5cf6;--bg:rgba(139,92,246,0.12);--cb:rgba(139,92,246,0.3)">
          <div class="stat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div class="stat-value">{{ loading() ? '—' : stats().lookups }}</div>
          <div class="stat-label">Lookup Lists</div>
        </div>

        <div class="stat-card" style="--c:#10b981;--bg:rgba(16,185,129,0.12);--cb:rgba(16,185,129,0.3)">
          <div class="stat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div class="stat-value">{{ loading() ? '—' : stats().taskDefs }}</div>
          <div class="stat-label">Task Types</div>
        </div>

        <div class="stat-card" style="--c:#f97316;--bg:rgba(249,115,22,0.12);--cb:rgba(249,115,22,0.3)">
          <div class="stat-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="5" height="18" rx="1"/>
              <rect x="10" y="3" width="5" height="12" rx="1"/>
              <rect x="17" y="3" width="5" height="15" rx="1"/>
            </svg>
          </div>
          <div class="stat-value">{{ loading() ? '—' : stats().activeTasks }}</div>
          <div class="stat-label">Active Tasks</div>
        </div>
      </div>

      <!-- Feature navigation cards -->
      <section class="section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Platform Modules</h2>
            <p class="section-sub">Everything available from the navigation</p>
          </div>
        </div>

        <div class="feature-grid">
          @for (f of features; track f.link; let i = $index) {
            <a [routerLink]="f.link" class="feature-card" [style]="'--c:' + f.color + ';--bg:' + f.bg + ';animation-delay:' + (i * 0.06) + 's'">
              <div class="feature-top">
                <div class="feature-icon-chip" [style.background]="f.bg" [style.color]="f.color">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="f.iconPath | trustHtml"></svg>
                </div>
                <div class="feature-arrow-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </div>
              <div class="feature-title">{{ f.title }}</div>
              <div class="feature-desc">{{ f.desc }}</div>
              <div class="feature-tag" [style.background]="f.bg" [style.color]="f.color">{{ f.section }}</div>
            </a>
          }
        </div>
      </section>


    </div>
  `,
  styles: [`
    .dash {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Page header ────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--tx);
      letter-spacing: -0.03em;
      margin: 0 0 0.3rem;
    }

    .page-date {
      font-size: 0.875rem;
      color: var(--tx3);
      margin: 0;
      font-weight: 400;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #3b82f6;
      color: #fff;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.625rem 1.25rem;
      border-radius: 9px;
      text-decoration: none;
      letter-spacing: 0.01em;
      transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }

    .cta-btn:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(59,130,246,0.4);
    }

    /* ── Stats row ──────────────────────────────────────── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.125rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--sf);
      border-radius: 16px;
      border: 1px solid var(--bds);
      border-top: 3px solid var(--c);
      padding: 1.5rem 1.375rem 1.375rem;
      display: flex;
      flex-direction: column;
      gap: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      animation: slideUp 0.4s ease both;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .stat-card:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.4);
      transform: translateY(-2px);
    }

    .stat-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 13px;
      background: var(--bg);
      border: 1.5px solid var(--cb);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c);
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--c);
      letter-spacing: -0.05em;
      line-height: 1;
      margin-bottom: 0.375rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--tx4);
      font-weight: 500;
    }

    /* ── Sections ───────────────────────────────────────── */
    .section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.125rem;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--tx);
      letter-spacing: -0.02em;
      margin: 0 0 0.25rem;
    }

    .section-sub {
      font-size: 0.875rem;
      color: var(--tx3);
      margin: 0;
    }

    /* ── Feature cards ──────────────────────────────────── */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.125rem;
    }

    .feature-card {
      background: var(--sf);
      border-radius: 16px;
      border: 1px solid var(--bds);
      padding: 1.5rem;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      animation: slideUp 0.45s ease both;
      transition: box-shadow 0.22s, transform 0.22s, background 0.22s, border-color 0.22s;
      position: relative;
    }

    .feature-card:hover {
      background: var(--bg);
      box-shadow: 0 8px 28px rgba(15,23,42,0.1);
      transform: translateY(-3px);
      border-color: var(--c);
    }

    .feature-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .feature-icon-chip {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: var(--bg);
      border: 1.5px solid var(--cb, rgba(0,0,0,0.07));
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--c);
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .feature-card:hover .feature-icon-chip {
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
      transform: scale(1.06);
    }

    .feature-arrow-icon {
      color: var(--bdi);
      transition: color 0.2s, transform 0.2s;
    }

    .feature-card:hover .feature-arrow-icon {
      color: var(--c);
      transform: translateX(4px);
    }

    .feature-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--tx);
      letter-spacing: -0.01em;
    }

    .feature-desc {
      font-size: 0.875rem;
      color: var(--tx4);
      line-height: 1.6;
      flex: 1;
    }

    .feature-tag {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 5px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      width: fit-content;
      margin-top: 0.375rem;
    }

    .flow-section {
      margin-bottom: 2.25rem;
    }

    /* ── Flow card ──────────────────────────────────────── */
    .flow-card {
      background: linear-gradient(145deg, var(--bg) 0%, var(--sf) 100%);
      border-radius: 16px;
      border: 1px solid var(--bds);
      padding: 2.25rem 1.75rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .flow-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 0;
      padding-bottom: 0.25rem;
    }

    .flow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.875rem;
      flex: 1;
      min-width: 128px;
      animation: slideUp 0.4s ease both;
      cursor: default;
    }

    .step-badge {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.18);
    }

    .step-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid rgba(0,0,0,0.06);
      box-shadow: 0 3px 10px rgba(0,0,0,0.08);
      transition: transform 0.22s, box-shadow 0.22s;
    }

    .flow-step:hover .step-icon-wrap {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.13);
    }

    .step-label {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--tx);
      text-align: center;
    }

    .step-desc {
      font-size: 0.8125rem;
      color: var(--tx3);
      text-align: center;
      line-height: 1.4;
    }

    .flow-connector {
      flex-shrink: 0;
      padding: 0 0.25rem;
      margin-top: -2.25rem;
      opacity: 0.7;
    }

    /* ── Responsive ─────────────────────────────────────── */
    @media (max-width: 1100px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .feature-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 700px) {
      .stats-row { grid-template-columns: 1fr; }
      .feature-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private formService = inject(FormService);
  private lookupService = inject(LookupService);
  private taskDefService = inject(TaskDefinitionService);
  private taskBoardService = inject(TaskBoardService);

  stats = signal({ forms: 0, lookups: 0, taskDefs: 0, activeTasks: 0 });
  loading = signal(true);

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  readonly features = [
    {
      title: 'Form Templates',
      desc: 'Design intelligent forms with dynamic fields, conditional logic, and structured data collection workflows.',
      link: '/forms',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      section: 'Admin',
      iconPath: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
    },
    {
      title: 'Lookups',
      desc: 'Manage reusable dropdown option lists that are shared across multiple form fields and versions.',
      link: '/lookups',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      section: 'Admin',
      iconPath: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'
    },
    {
      title: 'Task Definitions',
      desc: 'Define the automated tasks that get created when form submission conditions are satisfied by the rule engine.',
      link: '/tasks',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      section: 'Admin',
      iconPath: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
    },
    {
      title: 'Submit a Form',
      desc: 'Browse and fill out any published form as an end user. Experience the dynamic form renderer in action.',
      link: '/submit',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      section: 'Client',
      iconPath: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>'
    },
    {
      title: 'My Submissions',
      desc: 'Review your submitted forms, see all field values, and track which automated tasks were generated.',
      link: '/my-submissions',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
      section: 'Client',
      iconPath: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
    },
    {
      title: 'Task Board',
      desc: 'Manage generated tasks with an interactive Kanban board. Drag tasks between Pending, In Progress, and Completed.',
      link: '/task-board',
      color: '#f43f5e',
      bg: 'rgba(244,63,94,0.12)',
      section: 'Client',
      iconPath: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/>'
    },
  ];

  readonly steps = [
    {
      num: 1, label: 'Build Form', desc: 'Create fields, types & lookups',
      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
      iconPath: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
    },
    {
      num: 2, label: 'Define Rules', desc: 'Conditions & task triggers',
      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
      iconPath: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
    },
    {
      num: 3, label: 'Submit Form', desc: 'User fills out and sends',
      color: '#10b981', bg: 'rgba(16,185,129,0.12)',
      iconPath: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
    },
    {
      num: 4, label: 'Engine Fires', desc: 'Rules evaluate in real-time',
      color: '#f97316', bg: 'rgba(249,115,22,0.12)',
      iconPath: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
    },
    {
      num: 5, label: 'Tasks Created', desc: 'Automated actions queued',
      color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',
      iconPath: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
    },
  ];

  ngOnInit() {
    forkJoin({
      forms: this.formService.getAll().pipe(catchError(() => of([]))),
      lookups: this.lookupService.getAll().pipe(catchError(() => of([]))),
      tasks: this.taskDefService.getAll().pipe(catchError(() => of([]))),
      board: this.taskBoardService.getAll().pipe(catchError(() => of([]))),
    }).subscribe(({ forms, lookups, tasks, board }) => {
      this.stats.set({
        forms: forms.length,
        lookups: lookups.length,
        taskDefs: tasks.length,
        activeTasks: board.filter(t => t.status !== 'Completed').length,
      });
      this.loading.set(false);
    });
  }
}
