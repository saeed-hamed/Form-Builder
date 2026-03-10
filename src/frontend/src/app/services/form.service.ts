import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FormApiService } from './form-api.service';
import { ApiResponse, Form } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class FormService extends FormApiService {
  getAll() {
    return this.get<ApiResponse<Form[]>>('/api/forms').pipe(map(r => r.data));
  }

  getById(id: number) {
    return this.get<ApiResponse<Form>>(`/api/forms/${id}`).pipe(map(r => r.data));
  }

  create(title: string) {
    return this.post<ApiResponse<Form>>('/api/forms', { title }).pipe(map(r => r.data));
  }

  update(id: number, title: string) {
    return this.put<ApiResponse<string>>(`/api/forms/${id}`, { title });
  }

  deleteById(id: number) {
    return this.delete<ApiResponse<string>>(`/api/forms/${id}`);
  }
}
