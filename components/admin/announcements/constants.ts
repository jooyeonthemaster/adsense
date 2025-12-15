import { Badge } from '@/components/ui/badge';

export const PRIORITY_VARIANTS = {
  urgent: 'destructive',
  high: 'default',
  normal: 'secondary',
  low: 'outline',
} as const;

export const PRIORITY_LABELS = {
  urgent: '긴급',
  high: '높음',
  normal: '보통',
  low: '낮음',
} as const;

export const AUDIENCE_LABELS = {
  all: '전체',
  client: '거래처',
  admin: '관리자',
} as const;

export const INITIAL_FORM_DATA = {
  title: '',
  content: '',
  priority: 'normal' as const,
  target_audience: 'client' as const,
  expires_at: '',
  link_url: '',
  link_text: '',
};
