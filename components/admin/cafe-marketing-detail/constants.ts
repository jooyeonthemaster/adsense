export const contentStatusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '대기', variant: 'outline' },
  approved: { label: '승인됨', variant: 'default' },
  revision_requested: { label: '수정요청', variant: 'destructive' },
};

export const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '확인중', variant: 'outline' },
  approved: { label: '접수완료', variant: 'default' },
  script_writing: { label: '원고작성중', variant: 'default' },
  script_completed: { label: '원고완료', variant: 'default' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
  cancellation_requested: { label: '중단요청', variant: 'destructive' },
};

export const contentTypeConfig: Record<string, string> = {
  review: '후기성',
  info: '정보성',
};

export const scriptStatusConfig: Record<string, { label: string }> = {
  pending: { label: '대기중' },
  writing: { label: '작성중' },
  completed: { label: '완료' },
};
