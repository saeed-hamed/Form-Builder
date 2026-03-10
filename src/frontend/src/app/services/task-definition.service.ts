import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FormApiService } from './form-api.service';
import { ApiResponse, TaskDefinition } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TaskDefinitionService extends FormApiService {
  getAll() {
    return this.get<ApiResponse<TaskDefinition[]>>('/api/tasks').pipe(map(r => r.data));
  }

  create(name: string, description: string | null) {
    return this.post<ApiResponse<TaskDefinition>>('/api/tasks', { name, description }).pipe(map(r => r.data));
  }

  deleteById(id: number) {
    return this.delete<ApiResponse<string>>(`/api/tasks/${id}`);
  }
}
