import { CafeMarketingSubmission } from '@/types/database';

export interface SubmissionWithClient extends CafeMarketingSubmission {
  clients?: {
    company_name: string;
  };
  submission_number?: string;
  progress_percentage?: number;
  completed_count?: number;
}

export const statusConfig = {
  pending: { label: '확인중', color: 'bg-gray-100 text-gray-800' },
  approved: { label: '접수완료', color: 'bg-blue-100 text-blue-800' },
  script_writing: { label: '원고작성중', color: 'bg-yellow-100 text-yellow-800' },
  script_completed: { label: '원고작업완료', color: 'bg-purple-100 text-purple-800' },
  in_progress: { label: '구동중', color: 'bg-sky-100 text-sky-800' },
  completed: { label: '완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '중단', color: 'bg-red-100 text-red-800' },
};

export const scriptStatusLabels: Record<string, string> = {
  pending: '대기중',
  writing: '작성중',
  completed: '완료',
};

export const STATUS_OPTIONS: { value: SubmissionWithClient['status']; label: string }[] = [
  { value: 'pending', label: '확인중' },
  { value: 'approved', label: '접수완료' },
  { value: 'script_writing', label: '원고작성중' },
  { value: 'script_completed', label: '원고작업완료' },
  { value: 'in_progress', label: '구동중' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '중단' },
];














