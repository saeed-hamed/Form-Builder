import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FormApiService } from './form-api.service';
import { ApiResponse, FormVersion, Field, ConditionalRule, TaskTrigger } from '../models/api.models';

export interface CreateFieldRequest {
  fieldKey: string;
  label: string;
  fieldType: string;
  lookupId: number | null;
  orderIndex: number;
  required: boolean;
  placeholder: string | null;
  subFieldsJson: string | null;
}

export interface UpdateFieldRequest {
  label: string;
  fieldType: string;
  lookupId: number | null;
  orderIndex: number;
  required: boolean;
  placeholder: string | null;
  subFieldsJson: string | null;
}

export interface CreateRuleRequest {
  sourceFieldId: number;
  ruleType: string;
  conditionJson: string;
}

export interface CreateTriggerRequest {
  taskId: number;
  conditionJson: string;
}

@Injectable({ providedIn: 'root' })
export class VersionService extends FormApiService {
  // Versions
  getVersions(formId: number) {
    return this.get<ApiResponse<FormVersion[]>>(`/api/forms/${formId}/versions`).pipe(map(r => r.data));
  }

  getVersion(formId: number, versionId: number) {
    return this.get<ApiResponse<FormVersion>>(`/api/forms/${formId}/versions/${versionId}`).pipe(map(r => r.data));
  }

  createVersion(formId: number) {
    return this.post<ApiResponse<FormVersion>>(`/api/forms/${formId}/versions`, { definitionJson: '{}' }).pipe(map(r => r.data));
  }

  publishVersion(formId: number, versionId: number) {
    return this.post<ApiResponse<string>>(`/api/forms/${formId}/versions/${versionId}/publish`, {});
  }

  // Fields
  getFields(versionId: number) {
    return this.get<ApiResponse<Field[]>>(`/api/versions/${versionId}/fields`).pipe(map(r => r.data));
  }

  createField(versionId: number, req: CreateFieldRequest) {
    return this.post<ApiResponse<Field>>(`/api/versions/${versionId}/fields`, req).pipe(map(r => r.data));
  }

  updateField(versionId: number, fieldId: number, req: UpdateFieldRequest) {
    return this.put<ApiResponse<string>>(`/api/versions/${versionId}/fields/${fieldId}`, req);
  }

  deleteField(versionId: number, fieldId: number) {
    return this.delete<ApiResponse<string>>(`/api/versions/${versionId}/fields/${fieldId}`);
  }

  // Rules
  getRules(versionId: number) {
    return this.get<ApiResponse<ConditionalRule[]>>(`/api/versions/${versionId}/rules`).pipe(map(r => r.data));
  }

  createRule(versionId: number, req: CreateRuleRequest) {
    return this.post<ApiResponse<ConditionalRule>>(`/api/versions/${versionId}/rules`, req).pipe(map(r => r.data));
  }

  deleteRule(versionId: number, ruleId: number) {
    return this.delete<ApiResponse<string>>(`/api/versions/${versionId}/rules/${ruleId}`);
  }

  // Triggers
  getTriggers(versionId: number) {
    return this.get<ApiResponse<TaskTrigger[]>>(`/api/versions/${versionId}/triggers`).pipe(map(r => r.data));
  }

  createTrigger(versionId: number, req: CreateTriggerRequest) {
    return this.post<ApiResponse<TaskTrigger>>(`/api/versions/${versionId}/triggers`, req).pipe(map(r => r.data));
  }

  deleteTrigger(versionId: number, triggerId: number) {
    return this.delete<ApiResponse<string>>(`/api/versions/${versionId}/triggers/${triggerId}`);
  }
}
