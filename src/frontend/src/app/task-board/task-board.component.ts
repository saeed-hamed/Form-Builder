import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { TaskBoardService } from '../services/task-board.service';
import { UserService } from '../services/user.service';
import { TaskBoardItem, User } from '../models/api.models';

type Status = 'Pending' | 'In Progress' | 'Completed';

const COLUMNS: { status: Status; label: string; labelKey: string; color: string; bg: string; border: string; dot: string }[] = [
  { status: 'Pending',     label: 'Pending',     labelKey: 'board.statusPending',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  { status: 'In Progress', label: 'In Progress', labelKey: 'board.statusInProgress',  color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  dot: '#10b981' },
  { status: 'Completed',   label: 'Completed',   labelKey: 'board.statusCompleted',   color: '#4ade80', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   dot: '#22c55e' },
];

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [TranslocoPipe, FormsModule],
  template: `
    <div class="board-page">

      <!-- Page header -->
      <div class="board-header">
        <div>
          <h1 class="board-title">{{ 'board.title' | transloco }}</h1>
          <p class="board-subtitle">{{ 'board.subtitle' | transloco }}</p>
        </div>
        <div class="board-stats">
          @for (col of columns; track col.status) {
            <div class="stat-chip" [style.background]="col.bg" [style.border-color]="col.border" [style.color]="col.color">
              <span class="stat-dot" [style.background]="col.dot"></span>
              {{ countFor(col.status) }} {{ col.labelKey | transloco }}
            </div>
          }
        </div>
      </div>

      @if (error()) {
        <div class="board-error">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="board-loading">
          <div class="spinner"></div>
          <span>{{ 'board.loading' | transloco }}</span>
        </div>
      } @else {
        <div class="board-columns">
          @for (col of columns; track col.status) {
            <div
              class="column"
              [style.border-top-color]="col.dot"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event, col.status)"
            >
              <!-- Column header -->
              <div class="column-header">
                <div class="column-title">
                  <span class="column-dot" [style.background]="col.dot"></span>
                  <span [style.color]="col.color">{{ col.labelKey | transloco }}</span>
                </div>
                <span class="column-count" [style.background]="col.bg" [style.color]="col.color">
                  {{ countFor(col.status) }}
                </span>
              </div>

              <!-- Cards -->
              <div class="column-body">
                @for (task of tasksFor(col.status); track task.submissionTaskId) {
                  <div
                    class="task-card"
                    draggable="true"
                    (dragstart)="onDragStart($event, task)"
                    (dragend)="onDragEnd()"
                    [class.dragging]="draggingId() === task.submissionTaskId"
                  >
                    <!-- Status accent bar -->
                    <div class="card-accent" [style.background]="col.dot"></div>

                    <div class="card-body">
                      <div class="card-task-name">{{ task.taskName }}</div>

                      <div class="card-meta">
                        <div class="card-meta-row">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span>{{ task.formTitle }}</span>
                        </div>
                        <div class="card-meta-row">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span>{{ task.submittedBy }}</span>
                        </div>
                      </div>

                      <div class="card-assignee" (click)="$event.stopPropagation()">
                        <span class="assignee-label">{{ 'taskBoard.assignee' | transloco }}</span>
                        <div class="assignee-control">
                          <span class="assignee-avatar" [class.assigned]="!!task.assignedToName">
                            {{ task.assignedToName ? initials(task.assignedToName) : '—' }}
                          </span>
                          <select
                            class="assignee-select"
                            [ngModel]="task.assignedToUserId"
                            (ngModelChange)="onAssign(task, $event)"
                            (mousedown)="$event.stopPropagation()"
                          >
                            <option [ngValue]="null">{{ 'taskBoard.unassigned' | transloco }}</option>
                            @for (user of users(); track user.userId) {
                              <option [ngValue]="user.userId">{{ user.name }}</option>
                            }
                          </select>
                        </div>
                      </div>

                      <div class="card-due">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        @if (task.dueDate) {
                          <span class="due-text" [class.overdue]="isOverdue(task)" [class.due-soon]="isDueSoon(task)">
                            {{ formatDueDate(task.dueDate) }}
                          </span>
                          @if (isOverdue(task)) {
                            <span class="due-badge due-badge--overdue">{{ 'taskBoard.overdue' | transloco }}</span>
                          } @else if (isDueSoon(task)) {
                            <span class="due-badge due-badge--soon">{{ 'taskBoard.dueSoon' | transloco }}</span>
                          } @else {
                            <span class="due-badge due-badge--ok">{{ 'taskBoard.onTrack' | transloco }}</span>
                          }
                        } @else {
                          <span class="due-text due-text--none">{{ 'taskBoard.noDueDate' | transloco }}</span>
                        }
                      </div>

                      <div class="card-footer">
                        <span class="card-date">{{ timeAgo(task.createdAt) }}</span>
                        @if (task.status === 'Completed' && task.completedAt) {
                          <span class="card-completed-badge">{{ 'board.done' | transloco }}</span>
                        }
                      </div>
                    </div>
                  </div>
                }

                @if (countFor(col.status) === 0) {
                  <div class="column-empty">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
                    </svg>
                    <span>{{ 'board.dropHere' | transloco }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .board-page {
      padding: 1.5rem 2rem;
      min-height: 100%;
      background: var(--bg);
    }

    .board-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .board-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--tx);
      letter-spacing: -0.02em;
      margin: 0 0 0.25rem;
    }

    .board-subtitle {
      font-size: 0.8125rem;
      color: var(--tx4);
      margin: 0;
    }

    .board-stats {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.3rem 0.75rem;
      border-radius: 99px;
      border: 1px solid;
    }

    .stat-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .board-error {
      background: var(--error-bg);
      color: #f87171;
      border: 1px solid var(--error-border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .board-loading {
      display: flex;
      align-items: center;
      justify-content: center;
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

    .board-columns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      align-items: start;
    }

    .column {
      background: var(--sf);
      border-radius: 12px;
      border: 1px solid var(--bds);
      border-top: 3px solid;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      min-height: 200px;
      transition: box-shadow 0.15s;
    }

    .column.drag-over {
      box-shadow: 0 0 0 2px #10b981, 0 4px 16px rgba(16,185,129,0.15);
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem 0.625rem;
      border-bottom: 1px solid var(--bds);
    }

    .column-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .column-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .column-count {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 99px;
      min-width: 24px;
      text-align: center;
    }

    .column-body {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      min-height: 100px;
    }

    .column-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 2rem 1rem;
      color: var(--tx5);
      font-size: 0.8rem;
      border: 2px dashed var(--bd);
      border-radius: 8px;
      text-align: center;
    }

    .task-card {
      background: var(--sf2);
      border: 1px solid var(--bd);
      border-radius: 8px;
      display: flex;
      overflow: hidden;
      cursor: grab;
      transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .task-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }

    .task-card:active { cursor: grabbing; }

    .task-card.dragging {
      opacity: 1;
    }

    .card-accent {
      width: 4px;
      flex-shrink: 0;
    }

    .card-body {
      padding: 0.625rem 0.75rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .card-task-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--tx);
      line-height: 1.3;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .card-meta-row {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      color: var(--tx4);
    }

    .card-meta-row svg { flex-shrink: 0; opacity: 0.7; }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.125rem;
    }

    .card-date {
      font-size: 0.7rem;
      color: var(--tx3);
    }

    .card-completed-badge {
      font-size: 0.7rem;
      font-weight: 600;
      color: #4ade80;
      background: rgba(34,197,94,0.15);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .card-due {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.3rem;
      padding-top: 0.3rem;
      border-top: 1px solid var(--bds);
      flex-wrap: wrap;
    }

    .card-due svg { flex-shrink: 0; color: var(--tx4); }

    .due-text {
      font-size: 0.72rem;
      color: var(--tx3);
      flex: 1;
    }

    .due-text.overdue { color: #f87171; font-weight: 600; }
    .due-text.due-soon { color: #f59e0b; font-weight: 600; }
    .due-text--none { color: var(--tx5); font-style: italic; }

    .due-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .due-badge--overdue { color: #f87171; background: rgba(248,113,113,0.15); }
    .due-badge--soon    { color: #f59e0b; background: rgba(245,158,11,0.12); }
    .due-badge--ok      { color: #10b981; background: rgba(16,185,129,0.12); }

    .card-assignee {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.375rem;
      padding-top: 0.375rem;
      border-top: 1px solid var(--bds);
    }

    .assignee-label {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--tx4);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }

    .assignee-control {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex: 1;
      min-width: 0;
      background: var(--sf);
      border: 1px solid var(--bd);
      border-radius: 6px;
      padding: 0.2rem 0.35rem;
      transition: border-color 0.15s;
    }

    .assignee-control:focus-within {
      border-color: var(--accent);
    }

    .assignee-avatar {
      width: 1.375rem;
      height: 1.375rem;
      border-radius: 50%;
      background: var(--bd);
      color: var(--tx3);
      font-size: 0.58rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }

    .assignee-avatar.assigned {
      background: var(--accent);
      color: #fff;
    }

    .assignee-select {
      flex: 1;
      min-width: 0;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--tx);
      background: var(--sf);
      border: none;
      outline: none;
      cursor: pointer;
      padding: 0;
      appearance: none;
      -webkit-appearance: none;
    }

    .assignee-select option {
      background: var(--sf);
      color: var(--tx);
    }
  `]
})
export class TaskBoardComponent implements OnInit {
  private taskBoardService = inject(TaskBoardService);
  private userService = inject(UserService);

  tasks = signal<TaskBoardItem[]>([]);
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  draggingId = signal<number | null>(null);
  draggingTask = signal<TaskBoardItem | null>(null);

  columns = COLUMNS;

  ngOnInit() {
    this.load();
    this.userService.getAll().subscribe({ next: data => this.users.set(data) });
  }

  load() {
    this.loading.set(true);
    this.taskBoardService.getAll().subscribe({
      next: data => { this.tasks.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load tasks'); this.loading.set(false); }
    });
  }

  onAssign(task: TaskBoardItem, userId: number | null) {
    const prevUserId = task.assignedToUserId;
    const prevName = task.assignedToName;
    const user = userId ? this.users().find(u => u.userId === userId) ?? null : null;

    // Optimistic update
    this.tasks.update(ts => ts.map(t =>
      t.submissionTaskId === task.submissionTaskId
        ? { ...t, assignedToUserId: userId, assignedToName: user?.name ?? null }
        : t
    ));

    this.taskBoardService.assign(task.submissionTaskId, userId).subscribe({
      error: () => {
        // Revert
        this.tasks.update(ts => ts.map(t =>
          t.submissionTaskId === task.submissionTaskId
            ? { ...t, assignedToUserId: prevUserId, assignedToName: prevName }
            : t
        ));
        this.error.set('Failed to assign task');
      }
    });
  }

  isOverdue(task: TaskBoardItem): boolean {
    if (!task.dueDate || task.status === 'Completed') return false;
    return new Date(task.dueDate) < new Date();
  }

  isDueSoon(task: TaskBoardItem): boolean {
    if (!task.dueDate || task.status === 'Completed' || this.isOverdue(task)) return false;
    const diff = new Date(task.dueDate).getTime() - Date.now();
    return diff < 48 * 60 * 60 * 1000; // within 48 hours
  }

  formatDueDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  tasksFor(status: Status): TaskBoardItem[] {
    return this.tasks().filter(t => t.status === status);
  }

  countFor(status: Status): number {
    return this.tasks().filter(t => t.status === status).length;
  }

  // Drag-and-drop
  onDragStart(event: DragEvent, task: TaskBoardItem) {
    this.draggingId.set(task.submissionTaskId);
    this.draggingTask.set(task);
    event.dataTransfer?.setData('text/plain', String(task.submissionTaskId));
  }

  onDragEnd() {
    this.draggingId.set(null);
    this.draggingTask.set(null);
    document.querySelectorAll('.column').forEach(el => el.classList.remove('drag-over'));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    const col = (event.currentTarget as HTMLElement);
    col.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    const col = (event.currentTarget as HTMLElement);
    const related = event.relatedTarget as Node | null;
    if (!col.contains(related)) col.classList.remove('drag-over');
  }

  onDrop(event: DragEvent, targetStatus: Status) {
    event.preventDefault();
    const col = (event.currentTarget as HTMLElement);
    col.classList.remove('drag-over');

    const task = this.draggingTask();
    if (!task || task.status === targetStatus) return;

    // Optimistic update
    this.tasks.update(ts =>
      ts.map(t => t.submissionTaskId === task.submissionTaskId
        ? { ...t, status: targetStatus }
        : t)
    );

    this.taskBoardService.updateStatus(task.submissionTaskId, targetStatus).subscribe({
      error: () => {
        // Revert on failure
        this.tasks.update(ts =>
          ts.map(t => t.submissionTaskId === task.submissionTaskId
            ? { ...t, status: task.status }
            : t)
        );
        this.error.set('Failed to update task status');
      }
    });
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }
}
