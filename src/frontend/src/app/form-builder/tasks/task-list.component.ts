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
              <label>{{ 'common.name' | transloco }}</label>
              <input formControlName="name" [placeholder]="'tasks.namePlaceholder' | transloco" />
            </div>
            <div class="form-row">
              <label>{{ 'common.description' | transloco }}</label>
              <textarea formControlName="description" rows="2" [placeholder]="'tasks.descriptionPlaceholder' | transloco"></textarea>
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
              <th>{{ 'tasks.colDescription' | transloco }}</th>
              <th>{{ 'common.actions' | transloco }}</th>
            </tr>
          </thead>
          <tbody>
            @for (task of tasks(); track task.taskId) {
              <tr>
                <td>{{ task.name }}</td>
                <td>{{ task.description || '—' }}</td>
                <td>
                  <button class="btn-sm btn-danger" (click)="deleteTask(task.taskId)">
                    {{ 'common.delete' | transloco }}
                  </button>
                </td>
              </tr>
            }
            @if (tasks().length === 0) {
              <tr>
                <td colspan="3" style="text-align:center;color:var(--tx3);padding:2rem">
                  {{ 'tasks.empty' | transloco }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskDefinitionService);
  private fb = inject(FormBuilder);

  tasks = signal<TaskDefinition[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showCreateForm = signal(false);

  createFg = this.fb.group({
    name: ['', Validators.required],
    description: ['']
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
    const { name, description } = this.createFg.value;
    this.taskService.create(name!, description || null).subscribe({
      next: task => {
        this.tasks.update(ts => [...ts, task]);
        this.toggleCreateForm();
      },
      error: () => this.error.set('Failed to create task')
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
