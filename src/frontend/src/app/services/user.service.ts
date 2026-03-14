import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FormApiService } from './form-api.service';
import { ApiResponse, User } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class UserService extends FormApiService {
  getAll() {
    return this.get<ApiResponse<User[]>>('/api/users').pipe(map(r => r.data));
  }

  create(payload: { name: string; email: string; role: string }) {
    return this.post<ApiResponse<User>>('/api/users', payload).pipe(map(r => r.data));
  }

  update(userId: number, payload: { name: string; email: string; role: string }) {
    return this.put<ApiResponse<string>>(`/api/users/${userId}`, payload);
  }

  deactivate(userId: number) {
    return this.delete<ApiResponse<string>>(`/api/users/${userId}`);
  }
}
