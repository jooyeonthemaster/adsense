export const starRatingConfig: Record<string, { label: string; icon: string }> = {
  mixed: { label: '혼합', icon: '⭐' },
  five: { label: '5점만', icon: '⭐⭐⭐⭐⭐' },
  four: { label: '4점만', icon: '⭐⭐⭐⭐' },
};

export const scriptTypeConfig: Record<string, { label: string; color: string }> = {
  custom: { label: '원고 제공', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  ai: { label: 'AI 작성', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  provided: { label: '관리자 제공', color: 'bg-green-100 text-green-700 border-green-200' },
};
