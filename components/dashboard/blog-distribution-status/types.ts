export interface BlogDistribution {
  id: string;
  submission_number: string;
  distribution_type: 'reviewer' | 'video' | 'automation';
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  keywords: string[] | null;
  total_points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'as_in_progress';
  created_at: string;
  progress_percentage?: number;
  completed_count?: number;
}

export interface BlogDistributionStats {
  total: number;
  in_progress: number;
  completed: number;
}
