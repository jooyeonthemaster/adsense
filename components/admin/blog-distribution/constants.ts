import { Video, Zap, Users } from 'lucide-react';
import type { TypeConfigItem, StatusConfigItem } from './types';

// 배포 타입 설정
export const TYPE_CONFIG: Record<string, TypeConfigItem> = {
  video: { label: '영상', icon: Video, color: 'bg-blue-500' },
  automation: { label: '자동화', icon: Zap, color: 'bg-emerald-500' },
  reviewer: { label: '리뷰어', icon: Users, color: 'bg-amber-500' },
};

// 상태 설정
export const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  pending: { label: '확인중', color: 'bg-gray-100 text-gray-800' },
  approved: { label: '승인됨', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '구동중', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '완료', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '중단', color: 'bg-red-100 text-red-800' },
  as_in_progress: { label: 'AS 진행 중', color: 'bg-amber-100 text-amber-800' },
  cancellation_requested: { label: '중단요청', color: 'bg-orange-100 text-orange-800' },
};

// 초기 필터 상태
export const INITIAL_FILTER_STATE = {
  searchQuery: '',
  typeFilter: 'all',
  statusFilter: 'all',
  createdDateFilter: null,
  startDateFilter: null,
};

// 초기 일일 기록 폼 데이터
export const INITIAL_DAILY_RECORD_FORM = {
  recordDate: new Date().toISOString().split('T')[0],
  completedCount: 0,
  recordNotes: '',
};
