// 체험단 관리 상수

export const EXPERIENCE_TYPE_MAP: Record<string, string> = {
  'blog-experience': '블로그 체험단',
  'xiaohongshu': '샤오홍슈',
  'journalist': '블로그 기자단',
  'influencer': '인플루언서',
};

export const getExperienceTypeName = (type: string): string => {
  return EXPERIENCE_TYPE_MAP[type] || type;
};
