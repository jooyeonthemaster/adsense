import { KakaomapSubmission } from '@/types/review/kmap-status';

export const calculateProgress = (submission: KakaomapSubmission): number => {
  if (submission.status === 'completed') return 100;

  // 진행률 = 리포트에 등록된 콘텐츠 수 (review_registered_date가 있는 것) / total_count
  const completedCount = submission.completed_count || 0;
  const totalCount = submission.total_count || 1;

  return Math.min((completedCount / totalCount) * 100, 100);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const canCancelSubmission = (submission: KakaomapSubmission) =>
  ['pending', 'waiting_content', 'review', 'revision_requested', 'in_progress'].includes(submission.status);

export const calculateStats = (submissions: KakaomapSubmission[]) => {
  return {
    total: submissions.length,
    in_progress: submissions.filter((s) =>
      ['pending', 'waiting_content', 'review', 'revision_requested', 'in_progress', 'as_in_progress'].includes(s.status)
    ).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
  };
};












