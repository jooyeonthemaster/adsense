/**
 * 카카오맵 리뷰 상태 라벨 통합 관리
 * 고객/관리자 모든 화면에서 동일한 라벨 사용
 */

export const KAKAOMAP_STATUS_LABELS = {
  pending: { label: '접수 확인중', variant: 'outline' as const },
  waiting_content: { label: '콘텐츠 대기중', variant: 'outline' as const },
  review: { label: '검수중', variant: 'default' as const },
  revision_requested: { label: '수정 요청', variant: 'destructive' as const },
  in_progress: { label: '구동중', variant: 'default' as const },
  completed: { label: '완료', variant: 'secondary' as const },
  cancelled: { label: '중단됨', variant: 'destructive' as const },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' as const },
} as const;

export type KakaomapStatus = keyof typeof KAKAOMAP_STATUS_LABELS;
