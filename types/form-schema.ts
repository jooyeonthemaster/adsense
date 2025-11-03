/**
 * 동적 폼 시스템 타입 정의
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'url'
  | 'email'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'file'
  | 'date';

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  accept?: string; // For file type
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  validation?: FieldValidation;
  options?: SelectOption[]; // For select type
}

export interface CalculationConfig {
  formula: string; // e.g., "pricePerUnit * daily_count * total_days"
  variables: string[]; // e.g., ["pricePerUnit", "daily_count", "total_days"]
}

export interface FormSchema {
  fields: FormField[];
  calculation?: CalculationConfig;
}

export interface DynamicSubmission {
  id: string;
  client_id: string;
  category_id: string;
  form_data: Record<string, any>;
  total_points: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
