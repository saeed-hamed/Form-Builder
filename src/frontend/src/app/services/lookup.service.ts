import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FormApiService } from './form-api.service';
import { ApiResponse, Lookup, LookupValue } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class LookupService extends FormApiService {
  getAll() {
    return this.get<ApiResponse<Lookup[]>>('/api/lookups').pipe(map(r => r.data));
  }

  getById(id: number) {
    return this.get<ApiResponse<Lookup>>(`/api/lookups/${id}`).pipe(map(r => r.data));
  }

  create(name: string, values: string[]) {
    return this.post<ApiResponse<Lookup>>('/api/lookups', { name, values }).pipe(map(r => r.data));
  }

  deleteById(id: number) {
    return this.delete<ApiResponse<string>>(`/api/lookups/${id}`);
  }

  addValue(lookupId: number, value: string, valueAr: string | null, orderIndex: number) {
    return this.post<ApiResponse<LookupValue>>(`/api/lookups/${lookupId}/values`, { value, valueAr, orderIndex }).pipe(map(r => r.data));
  }

  deleteValue(lookupId: number, valueId: number) {
    return this.delete<ApiResponse<string>>(`/api/lookups/${lookupId}/values/${valueId}`);
  }
}
