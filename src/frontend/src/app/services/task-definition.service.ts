import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FormApiService } from './form-api.service';
import { ApiResponse, TaskDefinition } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TaskDefinitionService extends FormApiService {
  getAll() {
    return this.get<ApiResponse<TaskDefinition[]>>('/api/tasks').pipe(map(r => r.data));
  }

  create(name: string, nameAr: string | null, description: string | null, dueDays: number | null) {
    return this.post<ApiResponse<TaskDefinition>>('/api/tasks', { name, nameAr, description, dueDays }).pipe(map(r => r.data));
  }

  update(id: number, payload: { name: string; nameAr: string | null; description: string | null; dueDays: number | null }) {
    return this.put<ApiResponse<TaskDefinition>>(`/api/tasks/${id}`, payload).pipe(map(r => r.data));
  }

  deleteById(id: number) {
    return this.delete<ApiResponse<string>>(`/api/tasks/${id}`);
  }
}
