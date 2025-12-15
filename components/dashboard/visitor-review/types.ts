export interface ReceiptReviewSubmission {
  id: string;
  client_id: string;
  submission_number?: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  has_script: boolean;
  guide_text: string | null;
  business_license_url: string | null;
  sample_receipt_url: string | null;
  photo_urls: string[] | null;
  total_points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'as_in_progress';
  start_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  actual_count_total?: number;
  progress_percentage?: number;
}

export type SortBy = 'date' | 'cost';

export interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { label: '확인중', variant: 'outline', color: 'gray' },
  approved: { label: '구동중', variant: 'default', color: 'blue' },
  in_progress: { label: '구동중', variant: 'default', color: 'blue' },
  completed: { label: '완료', variant: 'secondary', color: 'green' },
  cancelled: { label: '중단됨', variant: 'destructive', color: 'red' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default', color: 'amber' },
};

export interface VisitorReviewStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}
