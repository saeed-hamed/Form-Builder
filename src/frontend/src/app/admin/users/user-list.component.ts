import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import { UserService } from '../../services/user.service';
import { User } from '../../models/api.models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>{{ 'users.title' | transloco }}</h1>
          <p class="page-subtitle">{{ 'users.subtitle' | transloco }}</p>
        </div>
        <button class="btn-primary" (click)="toggleCreateForm()">
          {{ (showCreateForm() ? 'common.cancel' : 'users.newUser') | transloco }}
        </button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (showCreateForm()) {
        <div class="card">
          <h3>{{ 'users.newUser' | transloco }}</h3>
          <form [formGroup]="createFg" (ngSubmit)="submit()">
            <div class="form-row">
              <label>{{ 'users.name' | transloco }}</label>
              <input formControlName="name" [placeholder]="'users.name' | transloco" />
            </div>
            <div class="form-row">
              <label>{{ 'users.email' | transloco }}</label>
              <input formControlName="email" type="email" [placeholder]="'users.email' | transloco" />
            </div>
            <div class="form-row">
              <label>{{ 'users.role' | transloco }}</label>
              <select formControlName="role">
                <option value="member">{{ 'users.roles.member' | transloco }}</option>
                <option value="admin">{{ 'users.roles.admin' | transloco }}</option>
              </select>
            </div>
            <button type="submit" class="btn-primary" [disabled]="createFg.invalid">
              {{ 'users.newUser' | transloco }}
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
              <th>{{ 'users.name' | transloco }}</th>
              <th>{{ 'users.email' | transloco }}</th>
              <th>{{ 'users.role' | transloco }}</th>
              <th>{{ 'common.status' | transloco }}</th>
              <th>{{ 'common.created' | transloco }}</th>
              <th>{{ 'common.actions' | transloco }}</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.userId) {
              <tr>
                <td>
                  <div class="user-name-cell">
                    <span class="user-avatar">{{ initials(user.name) }}</span>
                    {{ user.name }}
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="role-badge" [class.role-admin]="user.role === 'admin'">
                    {{ (user.role === 'admin' ? 'users.roles.admin' : 'users.roles.member') | transloco }}
                  </span>
                </td>
                <td>
                  <span class="status-badge status-active">{{ 'users.active' | transloco }}</span>
                </td>
                <td>{{ user.createdAt | date:'mediumDate' }}</td>
                <td>
                  <button class="btn-sm btn-danger" (click)="deactivate(user.userId, user.name)">
                    {{ 'users.deactivate' | transloco }}
                  </button>
                </td>
              </tr>
            }
            @if (users().length === 0) {
              <tr>
                <td colspan="6" style="text-align:center;color:var(--tx3);padding:2rem">
                  {{ 'users.empty' | transloco }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .user-name-cell {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }
    .user-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      letter-spacing: 0.02em;
    }
    .role-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--tag-bg, #e5e7eb);
      color: var(--tx2);
    }
    .role-badge.role-admin {
      background: var(--accent-light, #d1fae5);
      color: var(--accent-dark, #065f46);
    }
    .status-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-active {
      background: #d1fae5;
      color: #065f46;
    }
  `]
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showCreateForm = signal(false);

  createFg = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['member']
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: data => { this.users.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load users'); this.loading.set(false); }
    });
  }

  toggleCreateForm() {
    this.showCreateForm.update(v => !v);
    if (!this.showCreateForm()) this.createFg.reset({ role: 'member' });
  }

  submit() {
    if (this.createFg.invalid) return;
    const { name, email, role } = this.createFg.value;
    this.userService.create({ name: name!, email: email!, role: role! }).subscribe({
      next: user => { this.users.update(us => [...us, user]); this.toggleCreateForm(); },
      error: () => this.error.set('Failed to create user')
    });
  }

  deactivate(userId: number, name: string) {
    if (!confirm(`Deactivate "${name}"?`)) return;
    this.userService.deactivate(userId).subscribe({
      next: () => this.users.update(us => us.filter(u => u.userId !== userId)),
      error: () => this.error.set('Failed to deactivate user')
    });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
