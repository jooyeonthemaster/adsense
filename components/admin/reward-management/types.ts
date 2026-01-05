export interface PlaceSubmission {
  id: string;
  submission_number?: string;
  client_id: string;
  company_name: string;
  place_url: string;
  place_mid: string;
  daily_count: number;
  total_days: number;
  total_points: number;
  status: string;
  created_at: string;
  start_date: string | null;
  notes: string | null;
  completed_count?: number;
  current_day?: number;
  progress_percentage?: number;
  media_type?: 'twoople' | 'eureka';
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
  };
}

export type MediaTypeFilter = 'all' | 'twoople' | 'eureka';

export interface RewardStats {
  total: number;
  in_progress: number;
  completed: number;
  total_cost: number;
}

export interface GroupedData {
  name: string;
  items: PlaceSubmission[];
  totalCost: number;
  count: number;
  inProgress: number;
  completed: number;
}

export type ViewMode = 'list' | 'group';
export type GroupByType = 'client';
