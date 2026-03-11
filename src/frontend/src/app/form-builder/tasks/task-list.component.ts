import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskDefinitionService } from '../../services/task-definition.service';
import { TaskDefinition } from '../../models/api.models';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Tasks</h1>
        <button class="btn-primary" (click)="toggleCreateForm()">
          {{ showCreateForm() ? 'Cancel' : '+ New Task' }}
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showCreateForm()) {
        <div class="card">
          <h3>New Task</h3>
          <form [formGroup]="createFg" (ngSubmit)="submit()">
            <div class="form-row">
              <label>Name</label>
              <input formControlName="name" placeholder="e.g. Verify Employment" />
            </div>
            <div class="form-row">
              <label>Description</label>
              <textarea formControlName="description" rows="2" placeholder="Optional description"></textarea>
            </div>
            <button type="submit" class="btn-primary" [disabled]="createFg.invalid">
              Create Task
            </button>
          </form>
        </div>
      }

      @if (loading()) {
        <p class="text-muted">Loading...</p>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (task of tasks(); track task.taskId) {
              <tr>
                <td>{{ task.name }}</td>
                <td>{{ task.description || '—' }}</td>
                <td>
                  <button class="btn-sm btn-danger" (click)="deleteTask(task.taskId)">
                    Delete
                  </button>
                </td>
              </tr>
            }
            @if (tasks().length === 0) {
              <tr>
                <td colspan="3" style="text-align:center;color:var(--tx3);padding:2rem">
                  No tasks yet
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
