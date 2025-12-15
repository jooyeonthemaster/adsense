export interface ReceiptReviewSubmission {
  id: string;
  submission_number: string;
  client_id: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  has_script: boolean;
  guide_text: string | null;
  total_points: number;
  status: string;
  created_at: string;
  actual_count_total?: number;
  progress_percentage?: number;
  content_items_count?: number;
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
  };
}

export interface GroupedData {
  name: string;
  items: ReceiptReviewSubmission[];
  totalCost: number;
  count: number;
  inProgress: number;
  completed: number;
}

export interface VisitorReviewStats {
  total: number;
  in_progress: number;
  completed: number;
  total_cost: number;
}

export type GroupByType = 'list' | 'client';
