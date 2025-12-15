// 알림/마이페이지 상수

export const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_xnxkGxj';

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  normal: 'text-blue-600 bg-blue-50 border-blue-200',
  low: 'text-gray-600 bg-gray-50 border-gray-200',
};

export const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;
};
