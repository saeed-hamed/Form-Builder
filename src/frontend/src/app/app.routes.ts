import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'lookups',
    loadComponent: () => import('./form-builder/lookups/lookup-list.component').then(m => m.LookupListComponent)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./form-builder/tasks/task-list.component').then(m => m.TaskListComponent)
  },
  {
    path: 'forms',
    loadComponent: () => import('./form-builder/forms/form-list.component').then(m => m.FormListComponent)
  },
  {
    path: 'forms/:formId',
    loadComponent: () => import('./form-builder/form-editor/form-editor.component').then(m => m.FormEditorComponent)
  },
  {
    path: 'task-board',
    loadComponent: () => import('./task-board/task-board.component').then(m => m.TaskBoardComponent)
  },
  {
    path: 'submit',
    loadComponent: () => import('./client/form-catalog.component').then(m => m.FormCatalogComponent)
  },
  {
    path: 'submit/:formId',
    loadComponent: () => import('./client/form-renderer.component').then(m => m.FormRendererComponent)
  },
  {
    path: 'my-submissions',
    loadComponent: () => import('./client/my-submissions.component').then(m => m.MySubmissionsComponent)
  }
];
