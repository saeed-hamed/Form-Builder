import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'forms', pathMatch: 'full' },
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
  }
];
