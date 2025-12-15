export const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '접수 대기', variant: 'outline' },
  waiting_content: { label: '콘텐츠 업로드 중', variant: 'default' },
  review: { label: '검수 대기', variant: 'outline' },
  revision_requested: { label: '수정 요청됨', variant: 'destructive' },
  in_progress: { label: '진행중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '취소됨', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};

export const starRatingConfig: Record<string, { label: string }> = {
  mixed: { label: '4~5점 혼합' },
  five: { label: '5점대만' },
  four: { label: '4점대만' },
};

export const contentStatusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '대기', variant: 'outline' },
  approved: { label: '승인됨', variant: 'default' },
  rejected: { label: '반려', variant: 'destructive' },
  revision_requested: { label: '수정요청', variant: 'secondary' }, // 레거시 호환
};
