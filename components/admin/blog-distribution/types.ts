import { LucideIcon } from 'lucide-react';
import { BlogDistributionSubmission, BlogDistributionDailyRecord } from '@/types/database';

// 클라이언트 정보가 포함된 Submission 타입
export interface SubmissionWithClient extends BlogDistributionSubmission {
  clients?: {
    company_name: string;
  };
  submission_number?: string;
  progress_percentage?: number;
  completed_count?: number;
}

// 배포 타입 설정
export interface TypeConfigItem {
  label: string;
  icon: LucideIcon;
  color: string;
}

// 상태 설정
export interface StatusConfigItem {
  label: string;
  color: string;
}

// 필터 상태
export interface FilterState {
  searchQuery: string;
  typeFilter: string;
  statusFilter: string;
  createdDateFilter: Date | null;
  startDateFilter: Date | null;
}

// 뷰 모드
export type ViewMode = 'list' | 'group';
export type GroupByMode = 'client' | 'type';

// 그룹 데이터
export interface GroupedItem {
  name: string;
  items: SubmissionWithClient[];
  totalCount: number;
  count: number;
  inProgress: number;
  completed: number;
}

// 통계 데이터
export interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}

// 일일 기록 폼 데이터
export interface DailyRecordFormData {
  recordDate: string;
  completedCount: number;
  recordNotes: string;
}

// 다이얼로그 상태
export interface DialogState {
  statusDialogOpen: boolean;
  dailyRecordDialogOpen: boolean;
  selectedSubmission: SubmissionWithClient | null;
  newStatus: string;
}

// Re-export for convenience
export type { BlogDistributionDailyRecord };
