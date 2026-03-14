import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FormApiService } from './form-api.service';
import { ApiResponse, TaskBoardItem } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TaskBoardService extends FormApiService {
  getAll() {
    return this.get<ApiResponse<TaskBoardItem[]>>('/api/task-board').pipe(map(r => r.data));
  }

  updateStatus(submissionTaskId: number, status: string) {
    return this.patch<ApiResponse<string>>(`/api/task-board/${submissionTaskId}/status`, { status });
  }

  assign(submissionTaskId: number, userId: number | null) {
    return this.patch<ApiResponse<string>>(`/api/task-board/${submissionTaskId}/assign`, { userId });
  }


}
