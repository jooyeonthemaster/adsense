import { UnifiedSubmission } from '@/types/admin/submissions';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 상세내용 표시 - 각 상품별 특성을 정확히 반영
 */
export const getSubmissionDetails = (submission: UnifiedSubmission): string => {
  switch (submission.type) {
    case 'place':
      return `일 ${submission.daily_count || 0}타 × ${submission.total_days || 0}일`;

    case 'receipt':
      const photoText = submission.has_photo ? '사진 O' : '사진 X';
      return `총 ${submission.total_count || 0}타 (${photoText})`;

    case 'kakaomap':
      const starText = submission.star_rating ? `${submission.star_rating}점` : '-';
      const photoRatioText = submission.photo_ratio ? `${submission.photo_ratio}%` : '-';
      return `총 ${submission.total_count || 0}타 (별점 ${starText}, 사진 ${photoRatioText})`;

    case 'blog':
      const distributionTypeLabel =
        submission.distribution_type === 'reviewer'
          ? '리뷰어형'
          : submission.distribution_type === 'video'
          ? '영상형'
          : submission.distribution_type === 'automation'
          ? '자동화형'
          : '-';
      const keywordsText = submission.keywords && submission.keywords.length > 0
        ? ` / ${submission.keywords.slice(0, 2).join(', ')}`
        : '';
      return `${distributionTypeLabel} / 총 ${submission.total_count || 0}건${keywordsText}`;

    case 'cafe':
      const regionText = submission.region || '-';
      const cafeCount = submission.cafe_details?.length || 0;
      const scriptStatusText =
        submission.script_status === 'completed' ? '원고 완료' :
        submission.script_status === 'writing' ? '원고 작성중' :
        submission.script_status === 'pending' ? '원고 대기' : '';
      return `${regionText} / ${cafeCount}개 카페 / 총 ${submission.total_count || 0}건${scriptStatusText ? ` (${scriptStatusText})` : ''}`;

    case 'experience':
      const experienceTypeLabel =
        submission.experience_type === 'blog-experience'
          ? '블로그 체험단'
          : submission.experience_type === 'xiaohongshu'
          ? '샤오홍슈'
          : submission.experience_type === 'journalist'
          ? '기자단'
          : submission.experience_type === 'influencer'
          ? '인플루언서'
          : '-';
      return `${experienceTypeLabel} / ${submission.team_count || 0}팀`;

    default:
      return '-';
  }
};

export const applySubmissionFilters = (
  submissions: UnifiedSubmission[],
  searchQuery: string,
  typeFilter: string,
  statusFilter: string,
  dateFilter: string,
  sortBy: string,
  createdDateFilter?: Date,
  startDateFilter?: Date
): UnifiedSubmission[] => {
  let filtered = [...submissions];

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.company_name?.toLowerCase().includes(query) ||
        s.clients?.company_name?.toLowerCase().includes(query)
    );
  }

  // Type filter
  if (typeFilter !== 'all') {
    filtered = filtered.filter((s) => s.type === typeFilter);
  }

  // Status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter((s) => s.status === statusFilter);
  }

  // Date filter (preset options)
  if (dateFilter !== 'all') {
    const now = new Date();
    const filterDate = new Date();

    if (dateFilter === 'today') {
      filterDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (dateFilter === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    }

    filtered = filtered.filter((s) => new Date(s.created_at) >= filterDate);
  }

  // Created Date Calendar Filter (접수일 지정)
  if (createdDateFilter) {
    const filterStart = new Date(createdDateFilter);
    filterStart.setHours(0, 0, 0, 0);
    const filterEnd = new Date(createdDateFilter);
    filterEnd.setHours(23, 59, 59, 999);

    filtered = filtered.filter((s) => {
      const createdAt = new Date(s.created_at);
      return createdAt >= filterStart && createdAt <= filterEnd;
    });
  }

  // Start Date Calendar Filter (구동일 지정)
  if (startDateFilter) {
    const filterStart = new Date(startDateFilter);
    filterStart.setHours(0, 0, 0, 0);
    const filterEnd = new Date(startDateFilter);
    filterEnd.setHours(23, 59, 59, 999);

    filtered = filtered.filter((s) => {
      // start_date 필드가 있는 경우 해당 필드 사용
      if (s.start_date) {
        const startDate = new Date(s.start_date);
        return startDate >= filterStart && startDate <= filterEnd;
      }
      return false;
    });
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'points-desc':
        return b.total_points - a.total_points;
      case 'points-asc':
        return a.total_points - b.total_points;
      default:
        return 0;
    }
  });

  return filtered;
};

export const createGroupedData = (
  submissions: UnifiedSubmission[],
  groupBy: 'client' | 'type'
) => {
  const groups = new Map<string, UnifiedSubmission[]>();

  submissions.forEach((sub) => {
    const key = groupBy === 'client'
      ? sub.clients?.company_name || '거래처 없음'
      : TYPE_LABELS[sub.type];

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(sub);
  });

  return Array.from(groups.entries()).map(([name, items]) => ({
    name,
    items,
    totalPoints: items.reduce((sum, item) => sum + item.total_points, 0),
    count: items.length,
    inProgress: items.filter(i => ['pending', 'in_progress', 'approved'].includes(i.status)).length,
    completed: items.filter(i => i.status === 'completed').length,
  }));
};

const TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  cafe: '카페 침투',
  experience: '체험단 마케팅',
};














