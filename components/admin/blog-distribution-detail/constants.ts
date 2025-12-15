export const contentStatusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '대기', variant: 'outline' },
  approved: { label: '승인됨', variant: 'default' },
  revision_requested: { label: '수정요청', variant: 'destructive' },
};

export const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '확인중', variant: 'outline' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
};

export const distributionTypeConfig: Record<string, string> = {
  reviewer: '리뷰어',
  video: '영상',
  automation: '자동화',
};

export const contentTypeConfig: Record<string, string> = {
  review: '후기성',
  info: '정보성',
};
