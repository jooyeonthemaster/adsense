import { ContentItem } from '@/types/review/kmap-content';

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getReviewStatusInfo = (item: ContentItem) => {
  if (item.review_status === 'approved') {
    if (item.has_been_revised) {
      return {
        className: 'bg-green-100 text-green-700 hover:bg-green-100',
        label: '✓ 수정완료',
      };
    } else {
      return {
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
        label: '✓ 승인완료',
      };
    }
  } else if (item.review_status === 'revision_requested') {
    return {
      variant: 'destructive' as const,
      label: '수정요청',
    };
  } else {
    return {
      variant: 'outline' as const,
      label: '검수대기',
    };
  }
};

