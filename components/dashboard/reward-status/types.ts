export type RewardStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'as_in_progress';

export interface RewardSubmission {
  id: string;
  submission_number?: string;
  company_name: string;
  place_url: string;
  place_mid: string;
  daily_count: number;
  total_days: number;
  current_day?: number;
  completed_count?: number;
  status: RewardStatus;
  created_at: string;
  total_points: number;
}
