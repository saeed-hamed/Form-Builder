import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TaskNote, ApiResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TaskNoteService {
  private http = inject(HttpClient);
  private base = 'http://localhost:5103/api/task-notes';

  getNotes(submissionTaskId: number): Observable<TaskNote[]> {
    return this.http.get<ApiResponse<TaskNote[]>>(`${this.base}/${submissionTaskId}`)
      .pipe(map(r => r.data));
  }

  addNote(submissionTaskId: number, author: string, body: string): Observable<TaskNote> {
    return this.http.post<ApiResponse<TaskNote>>(`${this.base}/${submissionTaskId}`, { author, body })
      .pipe(map(r => r.data));
  }
}
