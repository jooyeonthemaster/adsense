import { FileText, Video, Zap } from 'lucide-react';

export const typeConfig = {
  reviewer: { label: '리뷰어', icon: FileText, color: 'blue' },
  video: { label: '영상', icon: Video, color: 'red' },
  automation: { label: '자동화', icon: Zap, color: 'purple' },
};

export const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '확인중', variant: 'outline' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};
