import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  inject, signal, SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { TaskBoardItem, TaskNote, SubmissionResponse, User } from '../../models/api.models';
import { TaskNoteService } from '../../services/task-note.service';
import { SubmissionService } from '../../services/submission.service';
import { DirectionService } from '../../services/direction.service';

@Component({
  selector: 'app-task-detail-modal',
  standalone: true,
  imports: [FormsModule, TranslocoPipe],
  template: `
    <!-- Backdrop -->
    <div class="modal-backdrop" (click)="close.emit()"></div>

    <!-- Drawer -->
    <div class="modal-drawer">
      <!-- Header -->
      <div class="drawer-header">
        <div class="drawer-title-row">
          <h2 class="drawer-title">{{ taskLabel() }}</h2>
          <span class="status-badge" [class]="statusClass(task.status)">{{ task.status }}</span>
        </div>
        <button class="btn-close" (click)="close.emit()" aria-label="Close">✕</button>
      </div>

      <!-- Meta -->
      <div class="drawer-meta">
        <div class="meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>{{ task.formTitle }}</span>
        </div>
        <div class="meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>{{ task.submittedBy }}</span>
        </div>
        <div class="meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>{{ formatDate(task.createdAt) }}</span>
        </div>
        @if (task.dueDate) {
          <div class="meta-item" [class.meta-overdue]="isOverdue()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{{ 'taskBoard.dueDate' | transloco }}: {{ formatDate(task.dueDate) }}</span>
            @if (isOverdue()) { <span class="overdue-label">{{ 'taskBoard.overdue' | transloco }}</span> }
          </div>
        }
      </div>

      <!-- Assignee -->
      <div class="drawer-section">
        <div class="section-label">{{ 'taskBoard.assignee' | transloco }}</div>
        <div class="assignee-row">
          <span class="assignee-avatar" [class.assigned]="!!task.assignedToName">
            {{ task.assignedToName ? initials(task.assignedToName) : '—' }}
          </span>
          <select class="assignee-select-full" [ngModel]="task.assignedToUserId" (ngModelChange)="assigneeChange.emit($event)">
            <option [ngValue]="null">{{ 'taskBoard.unassigned' | transloco }}</option>
            @for (u of users; track u.userId) {
              <option [ngValue]="u.userId">{{ u.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Submission Values -->
      <div class="drawer-section">
        <div class="section-label">{{ 'taskDetail.submissionValues' | transloco }}</div>
        @if (loadingSubmission()) {
          <p class="muted-text">{{ 'common.loading' | transloco }}</p>
        } @else if (submission()) {
          <div class="values-table">
            @for (v of submission()!.values; track v.fieldId) {
              <div class="value-row">
                <span class="value-key">{{ v.fieldKey }}</span>
                <span class="value-val">{{ v.value || '—' }}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Notes -->
      <div class="drawer-section notes-section">
        <div class="section-label">{{ 'taskDetail.notes' | transloco }} ({{ notes().length }})</div>

        <div class="notes-thread">
          @for (note of notes(); track note.noteId) {
            <div class="note-item">
              <div class="note-header">
                <span class="note-author">{{ note.author }}</span>
                <span class="note-time">{{ formatDate(note.createdAt) }}</span>
              </div>
              <p class="note-body">{{ note.body }}</p>
            </div>
          }
          @if (notes().length === 0 && !loadingNotes()) {
            <p class="muted-text">{{ 'taskDetail.noNotes' | transloco }}</p>
          }
        </div>

        <!-- Add note form -->
        <div class="add-note-form">
          <input
            class="note-author-input"
            [(ngModel)]="newAuthor"
            [placeholder]="'taskDetail.authorPlaceholder' | transloco"
          />
          <textarea
            class="note-body-input"
            [(ngModel)]="newBody"
            [placeholder]="'taskDetail.notePlaceholder' | transloco"
            rows="3"
          ></textarea>
          <button
            class="btn-primary btn-sm"
            (click)="submitNote()"
            [disabled]="!newAuthor.trim() || !newBody.trim() || savingNote()"
          >
            {{ 'taskDetail.addNote' | transloco }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 100;
    }

    .modal-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      max-width: 100vw;
      height: 100vh;
      background: var(--sf);
      border-left: 1px solid var(--bd);
      z-index: 101;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      box-shadow: -4px 0 24px rgba(0,0,0,0.3);
    }

    .drawer-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid var(--bd);
      flex-shrink: 0;
    }

    .drawer-title-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      flex-wrap: wrap;
    }

    .drawer-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--tx);
      margin: 0;
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 99px;
      white-space: nowrap;
    }

    .status-badge.pending    { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-badge.in-progress { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-badge.completed  { background: rgba(74,222,128,0.15); color: #4ade80; }

    .btn-close {
      background: none;
      border: none;
      color: var(--tx4);
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1;
      transition: color 0.15s;
    }
    .btn-close:hover { color: var(--tx); }

    .drawer-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.25rem;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--bds);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      color: var(--tx4);
    }

    .meta-item svg { flex-shrink: 0; opacity: 0.7; }
    .meta-item.meta-overdue { color: #f87171; }
    .overdue-label {
      font-size: 0.65rem;
      font-weight: 700;
      background: rgba(248,113,113,0.15);
      color: #f87171;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .drawer-section {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--bds);
    }

    .section-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--tx4);
      margin-bottom: 0.625rem;
    }

    .assignee-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .assignee-avatar {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      background: var(--bd);
      color: var(--tx3);
      font-size: 0.62rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .assignee-avatar.assigned { background: var(--accent); color: #fff; }

    .assignee-select-full {
      flex: 1;
      background: var(--sf2);
      border: 1px solid var(--bd);
      border-radius: 6px;
      color: var(--tx);
      font-size: 0.8rem;
      padding: 0.35rem 0.5rem;
      outline: none;
      cursor: pointer;
    }

    .values-table {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .value-row {
      display: flex;
      gap: 0.75rem;
      font-size: 0.8rem;
    }

    .value-key {
      width: 140px;
      flex-shrink: 0;
      color: var(--tx4);
      font-weight: 500;
    }

    .value-val {
      color: var(--tx);
      word-break: break-word;
    }

    .notes-section { flex: 1; }

    .notes-thread {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
      max-height: 280px;
      overflow-y: auto;
    }

    .note-item {
      background: var(--sf2);
      border: 1px solid var(--bds);
      border-radius: 8px;
      padding: 0.625rem 0.75rem;
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }

    .note-author {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--tx2);
    }

    .note-time {
      font-size: 0.7rem;
      color: var(--tx4);
    }

    .note-body {
      font-size: 0.8rem;
      color: var(--tx);
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .muted-text {
      font-size: 0.8rem;
      color: var(--tx4);
      font-style: italic;
      margin: 0;
    }

    .add-note-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .note-author-input, .note-body-input {
      background: var(--sf2);
      border: 1px solid var(--bd);
      border-radius: 6px;
      color: var(--tx);
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
      outline: none;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.15s;
    }
    .note-author-input:focus, .note-body-input:focus { border-color: var(--accent); }
  `]
})
export class TaskDetailModalComponent implements OnInit, OnChanges {
  @Input({ required: true }) task!: TaskBoardItem;
  @Input() users: User[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() assigneeChange = new EventEmitter<number | null>();

  private noteService = inject(TaskNoteService);
  private submissionService = inject(SubmissionService);
  private dir = inject(DirectionService);

  notes = signal<TaskNote[]>([]);
  submission = signal<SubmissionResponse | null>(null);
  loadingNotes = signal(false);
  loadingSubmission = signal(false);
  savingNote = signal(false);

  newAuthor = '';
  newBody = '';

  ngOnInit() {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['task'] && !changes['task'].firstChange) {
      this.loadData();
    }
  }

  private loadData() {
    this.loadNotes();
    this.loadSubmission();
  }

  private loadNotes() {
    this.loadingNotes.set(true);
    this.noteService.getNotes(this.task.submissionTaskId).subscribe({
      next: data => { this.notes.set(data); this.loadingNotes.set(false); },
      error: () => this.loadingNotes.set(false)
    });
  }

  private loadSubmission() {
    this.loadingSubmission.set(true);
    this.submissionService.getById(this.task.submissionId).subscribe({
      next: data => { this.submission.set(data); this.loadingSubmission.set(false); },
      error: () => this.loadingSubmission.set(false)
    });
  }

  submitNote() {
    if (!this.newAuthor.trim() || !this.newBody.trim()) return;
    this.savingNote.set(true);
    this.noteService.addNote(this.task.submissionTaskId, this.newAuthor.trim(), this.newBody.trim()).subscribe({
      next: note => {
        this.notes.update(n => [...n, note]);
        this.newBody = '';
        this.savingNote.set(false);
      },
      error: () => this.savingNote.set(false)
    });
  }

  statusClass(status: string): string {
    return status === 'In Progress' ? 'in-progress' : status.toLowerCase();
  }

  isOverdue(): boolean {
    if (!this.task.dueDate || this.task.status === 'Completed') return false;
    return new Date(this.task.dueDate) < new Date();
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  taskLabel(): string {
    return (this.dir.isRtl() && this.task.taskNameAr) ? this.task.taskNameAr : this.task.taskName;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
