import { SubmissionStatus } from '@/types/submission';

export interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  submissionType: 'place' | 'receipt' | 'kakaomap' | 'blog' | 'cafe' | 'experience';
}

export interface DetailData {
  id: string;
  client_id: string;
  company_name: string;
  total_points: number;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  notes?: string;
  clients?: {
    id: string;
    username: string;
    company_name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  };
  // Place specific
  place_url?: string;
  daily_count?: number;
  total_days?: number;
  start_date?: string;
  // Receipt specific
  total_count?: number;
  business_license_url?: string;
  photo_urls?: string[];
  has_photo?: boolean;
  has_script?: boolean;
  // Kakaomap specific
  kakaomap_url?: string;
  text_review_count?: number;
  photo_review_count?: number;
  script_urls?: string[];
  script_confirmed?: boolean;
  // Blog specific
  distribution_type?: string;
  content_type?: string;
  keywords?: string[];
  // Cafe specific
  region?: string;
  cafe_details?: Array<{ name: string; count: number }>;
  script_status?: string;
  script_url?: string;
  guideline?: string;
}
