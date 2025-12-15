export const EXPERIENCE_TYPE_LABELS: Record<string, string> = {
  'blog-experience': '블로그 체험단',
  'xiaohongshu': '샤오홍슈',
  'journalist': '기자단',
  'influencer': '인플루언서',
};

export const STEP_LABELS: Record<string, { label: string; description: string }> = {
  register: { label: '블로거 등록', description: '관리자가 블로거 목록 등록' },
  selection: { label: '블로거 선택', description: '고객이 원하는 블로거 선택' },
  schedule: { label: '일정 등록', description: '관리자가 방문 일정 등록' },
  client_confirm: { label: '일정 확인', description: '고객이 방문 일정 확인' },
  publish: { label: '컨텐츠 발행', description: '블로거들이 리뷰 작성' },
  keyword_ranking: { label: '키워드 순위', description: '노출 순위 확인' },
  complete: { label: '캠페인 완료', description: '모든 작업 완료' },
};
