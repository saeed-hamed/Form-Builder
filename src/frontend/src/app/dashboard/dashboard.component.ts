import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormService } from '../services/form.service';
import { LookupService } from '../services/lookup.service';
import { TaskDefinitionService } from '../services/task-definition.service';
import { TaskBoardService } from '../services/task-board.service';
import { TrustHtmlPipe } from '../pipes/safe-html.pipe';
import { TranslocoPipe } from '@jsverse/transloco';
import { DirectionService } from '../services/direction.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TrustHtmlPipe, TranslocoPipe],
  template: `
    <div class="dash">

      <!-- Noise + ambient layer -->
      <div class="dash-noise"></div>
      <div class="blob blob-a"></div>
      <div class="blob blob-b"></div>

      <!-- ── Page header ─────────────────────────────── -->
      <div class="page-header">
        <div class="header-text">
          <h1 class="page-title">{{ 'dashboard.welcome' | transloco }}</h1>
          <p class="page-date">{{ today() }}</p>
        </div>
        <a routerLink="/submit" class="cta-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ 'dashboard.submitForm' | transloco }}
        </a>
      </div>

      <!-- ── How It Works ────────────────────────────── -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">{{ 'dashboard.howItWorks' | transloco }}</h2>
          <p class="section-sub">{{ 'dashboard.howItWorksSub' | transloco }}</p>
        </div>

        <div class="flow-card glass-card">
          <div class="flow-steps">
            @for (step of steps; track step.num; let last = $last) {
              <div class="flow-step" [style]="'--sc:' + step.color + ';--sb:' + step.bg + ';animation-delay:' + (step.num * 0.1) + 's'">
                <div class="step-num" [style.color]="step.color" [style.border-color]="step.bg">{{ step.num }}</div>
                <div class="step-icon-box" [style.background]="step.bg" [style.color]="step.color">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="step.iconPath | trustHtml"></svg>
                </div>
                <div class="step-label">{{ step.label | transloco }}</div>
                <div class="step-desc">{{ step.desc | transloco }}</div>
              </div>
              @if (!last) {
                <div class="flow-arrow">
                  <div class="flow-dashes"></div>
                  <div class="flow-pulse"></div>
                </div>
              }
            }
          </div>
        </div>
      </section>

      <!-- ── Stats ───────────────────────────────────── -->
      <div class="stats-row">
        @for (s of statCards; track s.key) {
          <div class="stat-card glass-card" [style]="'--c:' + s.color + ';--cg:' + s.glow">
            <div class="stat-icon" [style.color]="s.color">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="s.iconPath | trustHtml"></svg>
            </div>
            <div class="stat-value">{{ loading() ? '—' : stats()[s.key] }}</div>
            <div class="stat-label">{{ s.label | transloco }}</div>
          </div>
        }
      </div>

      <!-- ── Feature Bento Grid ──────────────────────── -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">{{ 'dashboard.platformModules' | transloco }}</h2>
          <p class="section-sub">{{ 'dashboard.platformModulesSub' | transloco }}</p>
        </div>

        <div class="bento-grid">
          @for (f of features; track f.link; let i = $index) {
            <a [routerLink]="f.link"
               class="feature-card glass-card"
               [style]="'--c:' + f.color + ';--cb:' + f.colorBg + ';grid-area:' + f.gridArea + ';animation-delay:' + (i * 0.07) + 's'">
              <!-- Icon floating top-right -->
              <div class="fc-icon-dot" [style.background]="f.colorBg" [style.color]="f.color">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="f.iconPath | trustHtml"></svg>
              </div>
              <!-- Section tag top-left -->
              <div class="fc-badge" [style.color]="f.color" [style.background]="f.colorBg">{{ f.section | transloco }}</div>
              <!-- Text anchored to bottom -->
              <div class="fc-body">
                <div class="fc-title">{{ f.title | transloco }}</div>
                <div class="fc-desc">{{ f.desc | transloco }}</div>
              </div>
              <!-- Arrow -->
              <div class="fc-arrow">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </a>
          }
        </div>
      </section>

    </div>
  `,
  styles: [`

    /* ═══════════════════════════════════════════════════════
       EMERALD SLATE & OBSIDIAN GLASS — Design System
       Dark  : deep forest obsidian, emerald accents
       Light : warm ivory surface, teal/forest accents
    ═══════════════════════════════════════════════════════ */

    :host {
      /* Shared */
      --radius-xl:  22px;
      --radius-lg:  16px;
      --radius-md:  12px;
      --radius-sm:  8px;
      --ease-spring: cubic-bezier(.34,1.56,.64,1);
      --ease-smooth: cubic-bezier(.4,0,.2,1);

      /* Dark theme defaults */
      --dash-bg:      #090e0c;
      --surface:      rgba(16, 24, 20, 0.72);
      --surface-solid:#111816;
      --stroke:       rgba(255,255,255,0.06);
      --stroke-hover: rgba(255,255,255,0.14);
      --tx:           #edf2f0;
      --tx2:          #a8bcb4;
      --tx3:          #6b8a7e;
      --shadow-card:  0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3);
      --shadow-hover: 0 2px 4px rgba(0,0,0,0.5), 0 16px 40px rgba(0,0,0,0.4);

      /* Primary CTA: Emerald */
      --cta-from: #059669;
      --cta-to:   #10b981;
      --cta-glow: rgba(16,185,129,0.45);
    }

    /* ── LIGHT THEME ─────────────────────────────────────── */
    :host-context(.light-theme) {
      --dash-bg:      #f2f7f5;
      --surface:      rgba(255, 255, 255, 0.78);
      --surface-solid:#ffffff;
      --stroke:       rgba(0,0,0,0.07);
      --stroke-hover: rgba(0,0,0,0.14);
      --tx:           #0a1a14;
      --tx2:          #4a6a5c;
      --tx3:          #8aaa9c;
      --shadow-card:  0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05);
      --shadow-hover: 0 2px 8px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.09);
      --cta-from:     #065f46;
      --cta-to:       #059669;
      --cta-glow:     rgba(6,95,70,0.35);
    }

    /* ══════════════════════════════════════════════════════ */

    .dash {
      position: relative;
      //animation: fadeUp .35s var(--ease-smooth) both;
      min-height: 100%;
      max-width: 1280px;
      margin-inline: auto;
      padding-inline: 2rem;
    }

    /* Noise texture overlay on dark */
    .dash-noise {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      opacity: .035;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px;
    }

    :host-context(.light-theme) .dash-noise { opacity: .018; }

    /* Ambient colour blobs */
    .blob {
      position: fixed;
      border-radius: 50%;
      filter: blur(100px);
      z-index: 0;
      pointer-events: none;
    }
    .blob-a {
      width: 500px; height: 500px;
      top: -120px; left: -160px;
      background: radial-gradient(circle, rgba(16,185,129,.1) 0%, transparent 70%);
    }
    .blob-b {
      width: 380px; height: 380px;
      bottom: 80px; right: -100px;
      background: radial-gradient(circle, rgba(5,150,105,.07) 0%, transparent 70%);
    }

    /* All foreground content above blobs */
    .page-header, .section, .stats-row { position: relative; z-index: 1; }

    /* Base glass card */
    .glass-card {
      background: var(--surface);
      backdrop-filter: blur(18px) saturate(160%);
      -webkit-backdrop-filter: blur(18px) saturate(160%);
      border: 1px solid var(--stroke);
      box-shadow: var(--shadow-card);
      transition: box-shadow .28s var(--ease-smooth), transform .28s var(--ease-smooth), border-color .28s;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes dashPulse {
      0%   { transform: translateX(-8px); opacity: 0; }
      25%  { opacity: 1; }
      75%  { opacity: 1; }
      100% { transform: translateX(32px); opacity: 0; }
    }

    /* ── Page header ─────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.875rem;
      font-weight: 750;
      letter-spacing: -.04em;
      color: var(--tx);
      margin: 0 0 .3rem;
      line-height: 1.1;
    }

    .page-date {
      font-size: .875rem;
      color: var(--tx3);
      margin: 0;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: .45rem;
      background: linear-gradient(135deg, var(--cta-from), var(--cta-to));
      color: #fff;
      font-size: .875rem;
      font-weight: 600;
      padding: .65rem 1.375rem;
      border-radius: var(--radius-md);
      text-decoration: none;
      letter-spacing: .01em;
      white-space: nowrap;
      box-shadow: 0 4px 16px var(--cta-glow);
      transition: transform .22s var(--ease-spring), box-shadow .22s;
    }
    .cta-btn:hover {
      transform: translateY(-3px) scale(1.025);
      box-shadow: 0 8px 28px var(--cta-glow);
    }

    /* ── Section header ──────────────────────────────────── */
    .section { margin-bottom: 2rem; }

    .section-header { margin-bottom: 1.125rem; }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -.02em;
      color: var(--tx);
      margin: 0 0 .2rem;
    }
    .section-sub {
      font-size: .8125rem;
      color: var(--tx3);
      margin: 0;
    }

    /* ── Flow card ───────────────────────────────────────── */
    .flow-card {
      border-radius: var(--radius-xl);
      padding: 2.25rem 1.75rem;
      overflow: hidden;
      position: relative;
    }

    /* Top-edge emerald shimmer line */
    .flow-card::before {
      content: '';
      position: absolute;
      top: 0; left: 10%; right: 10%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(16,185,129,.5), transparent);
      pointer-events: none;
    }

    .flow-steps {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 0;
    }

    .flow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .6rem;
      padding: 0 .75rem;
      flex: 1;
      min-width: 120px;
      animation: slideUp .4s var(--ease-smooth) both;
    }

    .step-num {
      width: 26px; height: 26px;
      border-radius: 50%;
      border: 1.5px solid;
      font-size: .7rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-icon-box {
      width: 60px; height: 60px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,.08);
      transition: transform .3s var(--ease-spring);
    }
    .flow-step:hover .step-icon-box {
      transform: translateY(-6px) scale(1.06);
    }

    .step-label {
      font-size: .8125rem;
      font-weight: 700;
      color: var(--tx);
      text-align: center;
    }
    .step-desc {
      font-size: .7rem;
      color: var(--tx3);
      text-align: center;
      line-height: 1.5;
    }

    /* Dashed connector with travelling pulse */
    .flow-arrow {
      flex-shrink: 0;
      width: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1.8rem; /* align with icon center */
      position: relative;
    }
    .flow-dashes {
      width: 100%;
      height: 1px;
      background: repeating-linear-gradient(
        to right,
        var(--stroke-hover) 0, var(--stroke-hover) 4px,
        transparent 4px, transparent 8px
      );
    }
    .flow-pulse {
      position: absolute;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16,185,129,.9);
      animation: dashPulse 2.8s ease-in-out infinite;
    }

    /* ── Stats row ───────────────────────────────────────── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.125rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: .25rem;
      position: relative;
      overflow: hidden;
      animation: slideUp .4s var(--ease-smooth) both;
    }

    /* Per-card colour glow blob */
    .stat-card::after {
      content: '';
      position: absolute;
      top: -24px; right: -24px;
      width: 90px; height: 90px;
      border-radius: 50%;
      background: var(--cg);
      opacity: .35;
      filter: blur(24px);
      pointer-events: none;
      transition: opacity .3s, transform .3s;
    }
    .stat-card:hover {
      box-shadow: var(--shadow-hover);
      transform: translateY(-4px);
      border-color: var(--stroke-hover);
    }
    .stat-card:hover::after { opacity: .7; transform: scale(1.3); }

    /* Left accent bar */
    .stat-card::before {
      content: '';
      position: absolute;
      left: 0; top: 20%; bottom: 20%;
      width: 3px;
      border-radius: 3px;
      background: var(--c);
      opacity: .7;
    }

    .stat-icon {
      margin-bottom: .75rem;
      opacity: .85;
      position: relative; z-index: 1;
      transition: transform .25s var(--ease-spring);
    }
    .stat-card:hover .stat-icon { transform: scale(1.1) rotate(-6deg); }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--c);
      letter-spacing: -.06em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      position: relative; z-index: 1;
    }
    .stat-label {
      font-size: .75rem;
      color: var(--tx3);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: .06em;
      position: relative; z-index: 1;
    }

    /* ── Bento Grid ──────────────────────────────────────── */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: minmax(160px, auto) minmax(160px, auto);
      gap: 1.125rem;
      grid-template-areas:
        "submit submit subs  board"
        "forms  lookups tasks tasks";
    }

    .feature-card {
      border-radius: var(--radius-xl);
      padding: 1.375rem;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      animation: slideUp .45s var(--ease-smooth) both;
    }

    /* Gradient wash from accent colour */
    .feature-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 80% 20%, var(--cb) 0%, transparent 65%);
      opacity: .7;
      pointer-events: none;
      transition: opacity .3s;
    }
    .feature-card:hover::before { opacity: 1; }

    .feature-card:hover {
      box-shadow: var(--shadow-hover), 0 0 0 1px var(--c);
      transform: translateY(-4px) scale(1.008);
      border-color: var(--c);
    }

    /* Icon dot — top right */
    .fc-icon-dot {
      position: absolute;
      top: 1.2rem;
      inset-inline-end: 1.2rem;
      width: 42px; height: 42px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,.1);
      z-index: 1;
      transition: transform .3s var(--ease-spring);
    }
    .feature-card:hover .fc-icon-dot { transform: rotate(-8deg) scale(1.1); }

    /* Section badge — top left */
    .fc-badge {
      position: absolute;
      top: 1.2rem;
      inset-inline-start: 1.2rem;
      font-size: .6rem;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
      padding: .2rem .55rem;
      border-radius: 5px;
      z-index: 1;
    }

    /* Title + desc pushed to bottom */
    .fc-body {
      margin-top: auto;
      padding-top: 3rem;
      position: relative; z-index: 1;
    }
    .fc-title {
      font-size: .9375rem;
      font-weight: 700;
      color: var(--tx);
      letter-spacing: -.01em;
      margin-bottom: .25rem;
    }
    .fc-desc {
      font-size: .775rem;
      color: var(--tx2);
      line-height: 1.55;
    }

    /* Arrow — bottom right */
    .fc-arrow {
      position: absolute;
      bottom: 1.2rem;
      inset-inline-end: 1.2rem;
      color: var(--c);
      opacity: .45;
      transition: opacity .25s, transform .25s var(--ease-spring);
      z-index: 1;
    }
    .feature-card:hover .fc-arrow {
      opacity: 1;
      transform: translate(3px, -3px);
    }

    /* ── Light theme card overrides ─────────────────────── */
    :host-context(.light-theme) .page-title {
      background: linear-gradient(135deg, #0a1a14 0%, #1a4a36 60%, #2d7a5e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    :host-context(.light-theme) .flow-card {
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 20px rgba(0,0,0,.07);
      border-color: rgba(0,0,0,0.08);
    }

    :host-context(.light-theme) .stat-card {
      background: #ffffff;
      border-color: rgba(0,0,0,0.08);
      box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 20px rgba(0,0,0,.07), 0 0 30px -15px var(--c);
    }

    :host-context(.light-theme) .stat-value {
      background: linear-gradient(135deg, var(--c), color-mix(in oklch, var(--c) 70%, #0a1a14));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    :host-context(.light-theme) .feature-card {
      background: #ffffff;
      border-color: rgba(0,0,0,0.08);
      box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.07);
    }

    :host-context(.light-theme) .fc-title { color: #0a1a14; }
    :host-context(.light-theme) .fc-desc  { color: #4a6a5c; }

    :host-context(.light-theme) .step-label { color: #0a1a14; }
    :host-context(.light-theme) .step-desc  { color: #6b8a7e; }

    :host-context(.light-theme) .step-icon-box {
      border-color: rgba(0,0,0,.06);
    }

    :host-context(.light-theme) .flow-dashes {
      background: repeating-linear-gradient(
        to right,
        rgba(0,0,0,.18) 0, rgba(0,0,0,.18) 4px,
        transparent 4px, transparent 8px
      );
    }

    /* ── Responsive ─────────────────────────────────────── */
    @media (max-width: 1200px) {
      .bento-grid {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: none;
        grid-template-areas:
          "submit submit"
          "subs   board"
          "forms  lookups"
          "tasks  tasks";
      }
    }
    @media (max-width: 960px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 700px) {
      .stats-row { grid-template-columns: 1fr; }
      .bento-grid {
        grid-template-columns: 1fr;
        grid-template-rows: none;
        grid-template-areas:
          "submit" "subs" "board" "forms" "lookups" "tasks";
      }
      .feature-card { min-height: 140px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private formService    = inject(FormService);
  private lookupService  = inject(LookupService);
  private taskDefService = inject(TaskDefinitionService);
  private taskBoardService = inject(TaskBoardService);
  private dir = inject(DirectionService);

  stats   = signal({ forms: 0, lookups: 0, taskDefs: 0, activeTasks: 0 });
  loading = signal(true);

  today = computed(() => new Date().toLocaleDateString(this.dir.isRtl() ? 'ar-SA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }));

  // Stat cards with per-card accent colours & glow colours
  readonly statCards = [
    {
      key: 'forms' as const,
      label: 'dashboard.statForms',
      color: '#f59e0b',
      glow: 'rgba(245,158,11,0.2)',
      iconPath: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
    },
    {
      key: 'lookups' as const,
      label: 'dashboard.statLookups',
      color: '#10b981',
      glow: 'rgba(16,185,129,0.2)',
      iconPath: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'
    },
    {
      key: 'taskDefs' as const,
      label: 'dashboard.statTaskTypes',
      color: '#f43f5e',
      glow: 'rgba(244,63,94,0.2)',
      iconPath: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
    },
    {
      key: 'activeTasks' as const,
      label: 'dashboard.statActiveTasks',
      color: '#a78bfa',
      glow: 'rgba(167,139,250,0.2)',
      iconPath: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/>'
    },
  ];

  readonly features = [
    {
      title:    'dashboard.feat.forms.title',
      desc:     'dashboard.feat.forms.desc',
      link:     '/forms',
      gridArea: 'forms',
      section:  'dashboard.sect.admin',
      color:    '#f59e0b',
      colorBg:  'rgba(245,158,11,0.14)',
      iconPath: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
    },
    {
      title:    'dashboard.feat.lookups.title',
      desc:     'dashboard.feat.lookups.desc',
      link:     '/lookups',
      gridArea: 'lookups',
      section:  'dashboard.sect.admin',
      color:    '#10b981',
      colorBg:  'rgba(16,185,129,0.14)',
      iconPath: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'
    },
    {
      title:    'dashboard.feat.tasks.title',
      desc:     'dashboard.feat.tasks.desc',
      link:     '/tasks',
      gridArea: 'tasks',
      section:  'dashboard.sect.admin',
      color:    '#f43f5e',
      colorBg:  'rgba(244,63,94,0.14)',
      iconPath: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
    },
    {
      title:    'dashboard.feat.submit.title',
      desc:     'dashboard.feat.submit.desc',
      link:     '/submit',
      gridArea: 'submit',
      section:  'dashboard.sect.client',
      color:    '#a78bfa',
      colorBg:  'rgba(167,139,250,0.14)',
      iconPath: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>'
    },
    {
      title:    'dashboard.feat.submissions.title',
      desc:     'dashboard.feat.submissions.desc',
      link:     '/my-submissions',
      gridArea: 'subs',
      section:  'dashboard.sect.client',
      color:    '#06b6d4',
      colorBg:  'rgba(6,182,212,0.14)',
      iconPath: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
    },
    {
      title:    'dashboard.feat.board.title',
      desc:     'dashboard.feat.board.desc',
      link:     '/task-board',
      gridArea: 'board',
      section:  'dashboard.sect.client',
      color:    '#fb923c',
      colorBg:  'rgba(251,146,60,0.14)',
      iconPath: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/>'
    },
  ];

  readonly steps = [
    {
      num: 1, label: 'dashboard.flow.step1.label', desc: 'dashboard.flow.step1.desc',
      color: '#f59e0b', bg: 'rgba(245,158,11,0.14)',
      iconPath: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
    },
    {
      num: 2, label: 'dashboard.flow.step2.label', desc: 'dashboard.flow.step2.desc',
      color: '#10b981', bg: 'rgba(16,185,129,0.14)',
      iconPath: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
    },
    {
      num: 3, label: 'dashboard.flow.step3.label', desc: 'dashboard.flow.step3.desc',
      color: '#a78bfa', bg: 'rgba(167,139,250,0.14)',
      iconPath: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
    },
    {
      num: 4, label: 'dashboard.flow.step4.label', desc: 'dashboard.flow.step4.desc',
      color: '#fb923c', bg: 'rgba(251,146,60,0.14)',
      iconPath: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
    },
    {
      num: 5, label: 'dashboard.flow.step5.label', desc: 'dashboard.flow.step5.desc',
      color: '#f43f5e', bg: 'rgba(244,63,94,0.14)',
      iconPath: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
    },
  ];

  ngOnInit() {
    forkJoin({
      forms:   this.formService.getAll().pipe(catchError(() => of([]))),
      lookups: this.lookupService.getAll().pipe(catchError(() => of([]))),
      tasks:   this.taskDefService.getAll().pipe(catchError(() => of([]))),
      board:   this.taskBoardService.getAll().pipe(catchError(() => of([]))),
    }).subscribe(({ forms, lookups, tasks, board }) => {
      this.stats.set({
        forms:       forms.length,
        lookups:     lookups.length,
        taskDefs:    tasks.length,
        activeTasks: board.filter(t => t.status !== 'Completed').length,
      });
      this.loading.set(false);
    });
  }
}
