import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FormApiService } from './form-api.service';
import { ApiResponse, SubmissionResponse } from '../models/api.models';

export interface SubmitRequest {
  formId: number;
  formVersionId: number;
  submittedBy: string;
  values: { fieldId: number; value: string }[];
}

@Injectable({ providedIn: 'root' })
export class SubmissionService extends FormApiService {
  submit(req: SubmitRequest) {
    return this.post<ApiResponse<SubmissionResponse>>('/api/submissions', req).pipe(map(r => r.data));
  }

  getById(submissionId: number) {
    return this.get<ApiResponse<SubmissionResponse>>(`/api/submissions/${submissionId}`).pipe(map(r => r.data));
  }

  getAll() {
    return this.get<ApiResponse<SubmissionResponse[]>>('/api/submissions').pipe(map(r => r.data));
  }

  getByForm(formId: number) {
    return this.get<ApiResponse<SubmissionResponse[]>>(`/api/forms/${formId}/submissions`).pipe(map(r => r.data));
  }
}
