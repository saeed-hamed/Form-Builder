export interface ApiResponse<T> {
  data: T;
}

export interface LookupValue {
  lookupValueId: number;
  lookupId: number;
  value: string;
  valueAr: string | null;
  orderIndex: number;
}

export interface Lookup {
  lookupId: number;
  name: string;
  values: LookupValue[];
}

export interface TaskDefinition {
  taskId: number;
  name: string;
  description: string | null;
  dueDays: number | null;
}

export interface Form {
  formId: number;
  title: string;
  activeVersionId: number | null;
  createdAt: string;
}

export interface FormVersion {
  versionId: number;
  formId: number;
  versionNumber: number;
  definitionJson: string;
  createdAt: string;
  published: boolean;
}

export interface SubField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'list' | 'yes_no';
  lookupId?: number | null;
}

export interface Field {
  fieldId: number;
  formVersionId: number;
  fieldKey: string;
  label: string;
  labelAr: string | null;
  fieldType: 'yes_no' | 'list' | 'date' | 'text' | 'number' | 'repeater';
  lookupId: number | null;
  orderIndex: number;
  required: boolean;
  placeholder: string | null;
  subFieldsJson: string | null;
}

export interface ConditionAction {
  type: string;
  target_field: string;
}

export interface ConditionJsonPayload {
  operator: string;
  value: string;
  actions: ConditionAction[];
}

export interface ConditionalRule {
  ruleId: number;
  formVersionId: number;
  sourceFieldId: number;
  sourceFieldKey: string;
  ruleType: string;
  conditionJson: string;
}

export interface TriggerCondition {
  field: string;
  operator: string;
  value: string;
}

export interface TriggerConditionJson {
  combinator: 'AND' | 'OR';
  conditions: TriggerCondition[];
}

export interface TaskTrigger {
  triggerId: number;
  formVersionId: number;
  taskId: number;
  taskName: string;
  conditionJson: string;
}

export interface SubmissionTaskResult {
  submissionTaskId: number;
  taskId: number;
  taskName: string;
  status: string;
  createdAt: string;
}

export interface SubmissionResponse {
  submissionId: number;
  formId: number;
  formVersionId: number;
  submittedBy: string;
  submittedAt: string;
  values: { submissionValueId: number; fieldId: number; fieldKey: string; value: string }[];
  generatedTasks: SubmissionTaskResult[];
}

export interface TaskBoardItem {
  submissionTaskId: number;
  taskId: number;
  taskName: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
  completedAt: string | null;
  submissionId: number;
  formTitle: string;
  submittedBy: string;
  submittedAt: string;
  assignedToUserId: number | null;
  assignedToName: string | null;
  dueDate: string | null;
}

export interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
