import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { TaskDefinitionService } from '../../services/task-definition.service';
import { TaskDefinition } from '../../models/api.models';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>{{ 'tasks.title' | transloco }}</h1>
        <button class="btn-primary" (click)="toggleCreateForm()">
          {{ (showCreateForm() ? 'common.cancel' : 'tasks.newTask') | transloco }}
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showCreateForm()) {
        <div class="card">
          <h3>{{ 'tasks.newTaskCard' | transloco }}</h3>
          <form [formGroup]="createFg" (ngSubmit)="submit()">
            <div class="form-row">
              <label>{{ 'common.name' | transloco }} <span class="lang-badge">EN</span></label>
              <input formControlName="name" [placeholder]="'tasks.namePlaceholder' | transloco" />
            </div>
            <div class="form-row">
              <label>{{ 'tasks.nameAr' | transloco }} <span class="lang-badge lang-badge--ar">AR</span></label>
              <input formControlName="nameAr" dir="rtl" placeholder="مثال: التحقق من التوظيف" />
            </div>
            <div class="form-row">
              <label>{{ 'common.description' | transloco }}</label>
              <textarea formControlName="description" rows="2" [placeholder]="'tasks.descriptionPlaceholder' | transloco"></textarea>
            </div>
            <div class="form-row">
              <label>{{ 'tasks.dueDays' | transloco }}</label>
              <input formControlName="dueDays" type="number" min="1" [placeholder]="'tasks.dueDaysPlaceholder' | transloco" />
            </div>
            <button type="submit" class="btn-primary" [disabled]="createFg.invalid">
              {{ 'tasks.createTask' | transloco }}
            </button>
          </form>
        </div>
      }

      @if (loading()) {
        <p class="text-muted">{{ 'common.loading' | transloco }}</p>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>{{ 'tasks.colName' | transloco }}</th>
              <th>{{ 'tasks.nameAr' | transloco }}</th>
              <th>{{ 'tasks.colDescription' | transloco }}</th>
              <th>{{ 'tasks.dueDays' | transloco }}</th>
              <th>{{ 'common.actions' | transloco }}</th>
            </tr>
          </thead>
          <tbody>
            @for (task of tasks(); track task.taskId) {
              @if (editingId() === task.taskId) {
                <tr class="edit-row">
                  <td>
                    <input class="inline-input" [formControl]="editFg.controls.name" />
                  </td>
                  <td>
                    <input class="inline-input" dir="rtl" [formControl]="editFg.controls.nameAr" placeholder="الاسم بالعربية" />
                  </td>
                  <td>
                    <input class="inline-input" [formControl]="editFg.controls.description" [placeholder]="'tasks.descriptionPlaceholder' | transloco" />
                  </td>
                  <td>
                    <input class="inline-input inline-input--narrow" type="number" min="1" [formControl]="editFg.controls.dueDays" [placeholder]="'tasks.dueDaysPlaceholder' | transloco" />
                  </td>
                  <td class="edit-actions">
                    <button class="btn-sm btn-primary" (click)="saveEdit(task.taskId)" [disabled]="editFg.invalid">
                      {{ 'common.save' | transloco }}
                    </button>
                    <button class="btn-sm btn-secondary" (click)="cancelEdit()">
                      {{ 'common.cancel' | transloco }}
                    </button>
                  </td>
                </tr>
              } @else {
                <tr>
                  <td>{{ task.name }}</td>
                  <td dir="rtl" style="text-align:right">{{ task.nameAr || '—' }}</td>
                  <td>{{ task.description || '—' }}</td>
                  <td>
                    @if (task.dueDays) {
                      <span class="due-days-badge">{{ task.dueDays }}d</span>
                    } @else {
                      <span style="color:var(--tx4)">—</span>
                    }
                  </td>
                  <td>
                    <button class="btn-sm btn-secondary" (click)="startEdit(task)">
                      {{ 'common.edit' | transloco }}
                    </button>
                    <button class="btn-sm btn-danger" (click)="deleteTask(task.taskId)" disabled>
                      {{ 'common.delete' | transloco }}
                    </button>
                  </td>
                </tr>
              }
            }
            @if (tasks().length === 0) {
              <tr>
                <td colspan="4" style="text-align:center;color:var(--tx3);padding:2rem">
                  {{ 'tasks.empty' | transloco }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .due-days-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(245,158,11,0.12);
      color: #f59e0b;
      border: 1px solid rgba(245,158,11,0.3);
    }

    .edit-row td {
      background: var(--sf2);
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }

    .inline-input {
      width: 100%;
      font-size: 0.875rem;
      padding: 0.3rem 0.5rem;
      background: var(--sf);
      color: var(--tx);
      border: 1px solid var(--bdi);
      border-radius: 6px;
      outline: none;
      box-sizing: border-box;
    }

    .inline-input:focus { border-color: var(--accent); }

    .inline-input--narrow { max-width: 120px; }

    .edit-actions { display: flex; gap: 0.4rem; align-items: center; }
  `]
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskDefinitionService);
  private fb = inject(FormBuilder);

  tasks = signal<TaskDefinition[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showCreateForm = signal(false);
  editingId = signal<number | null>(null);

  createFg = this.fb.group({
    name: ['', Validators.required],
    nameAr: [''],
    description: [''],
    dueDays: [null as number | null]
  });

  editFg = this.fb.group({
    name: ['', Validators.required],
    nameAr: [''],
    description: [''],
    dueDays: [null as number | null]
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.taskService.getAll().subscribe({
      next: data => { this.tasks.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load tasks'); this.loading.set(false); }
    });
  }

  toggleCreateForm() {
    this.showCreateForm.update(v => !v);
    if (!this.showCreateForm()) this.createFg.reset();
  }

  submit() {
    if (this.createFg.invalid) return;
    const { name, nameAr, description, dueDays } = this.createFg.value;
    this.taskService.create(name!, nameAr || null, description || null, dueDays ?? null).subscribe({
      next: task => {
        this.tasks.update(ts => [...ts, task]);
        this.toggleCreateForm();
      },
      error: () => this.error.set('Failed to create task')
    });
  }

  startEdit(task: TaskDefinition) {
    this.editingId.set(task.taskId);
    this.editFg.setValue({
      name: task.name,
      nameAr: task.nameAr ?? '',
      description: task.description ?? '',
      dueDays: task.dueDays ?? null
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editFg.reset();
  }

  saveEdit(taskId: number) {
    if (this.editFg.invalid) return;
    const { name, nameAr, description, dueDays } = this.editFg.value;
    this.taskService.update(taskId, { name: name!, nameAr: nameAr || null, description: description || null, dueDays: dueDays ?? null }).subscribe({
      next: updated => {
        this.tasks.update(ts => ts.map(t => t.taskId === taskId ? updated : t));
        this.cancelEdit();
      },
      error: () => this.error.set('Failed to update task')
    });
  }

  deleteTask(id: number) {
    if (!confirm('Delete this task?')) return;
    this.taskService.deleteById(id).subscribe({
      next: () => this.tasks.update(ts => ts.filter(t => t.taskId !== id)),
      error: () => this.error.set('Failed to delete task')
    });
  }
}
