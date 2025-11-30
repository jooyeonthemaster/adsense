import {
  Gift,
  Camera,
  MapPin,
  FileText,
  Coffee,
  Users,
  ClipboardList,
} from 'lucide-react';
import { ProductType, SubmissionStatus } from '@/types/submission';

// 대분류 카테고리 구조
export const categoryStructure = {
  all: { label: '전체', icon: ClipboardList, bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  reward: { label: '리워드', icon: Gift, bgColor: 'bg-sky-100', textColor: 'text-sky-600' },
  review: {
    label: '리뷰 마케팅',
    icon: Camera,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
  experience: {
    label: '체험단 마케팅',
    icon: Users,
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-600',
  },
  blog: {
    label: '블로그 배포',
    icon: FileText,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
  cafe: {
    label: '카페침투 마케팅',
    icon: Coffee,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
  },
};

// 세부 상품 설정
export const productConfig = {
  place: {
    label: '리워드',
    icon: Gift,
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-600',
    detailPath: '/dashboard/reward/status',
    productType: 'place' as const,
    category: 'reward',
  },
  receipt: {
    label: '네이버 영수증',
    icon: Camera,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    detailPath: '/dashboard/review/visitor/status',
    productType: 'receipt' as const,
    category: 'review',
  },
  kakaomap: {
    label: '카카오맵',
    icon: MapPin,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
    detailPath: '/dashboard/review/kmap/status',
    productType: 'kakaomap' as const,
    category: 'review',
  },
  'blog-video': {
    label: '영상 배포',
    icon: FileText,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    detailPath: '/dashboard/blog-distribution/status',
    productType: 'blog' as const,
    subType: 'video' as const,
    category: 'blog',
  },
  'blog-automation': {
    label: '자동화 배포',
    icon: FileText,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    detailPath: '/dashboard/blog-distribution/status',
    productType: 'blog' as const,
    subType: 'automation' as const,
    category: 'blog',
  },
  'blog-reviewer': {
    label: '리뷰어 배포',
    icon: FileText,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    detailPath: '/dashboard/blog-distribution/status',
    productType: 'blog' as const,
    subType: 'reviewer' as const,
    category: 'blog',
  },
  cafe: {
    label: '카페침투 마케팅',
    icon: Coffee,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    detailPath: '/dashboard/cafe/status',
    productType: 'cafe' as const,
    category: 'cafe',
  },
  'experience-blog': {
    label: '블로그 체험단',
    icon: Users,
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-600',
    detailPath: '/dashboard/experience/detail',
    productType: 'experience' as const,
    subType: 'blog-experience' as const,
    category: 'experience',
  },
  'experience-xiaohongshu': {
    label: '샤오홍슈(중국인 체험단)',
    icon: Users,
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-600',
    detailPath: '/dashboard/experience/detail',
    productType: 'experience' as const,
    subType: 'xiaohongshu' as const,
    category: 'experience',
  },
  'experience-journalist': {
    label: '블로그 기자단',
    icon: Users,
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-600',
    detailPath: '/dashboard/experience/detail',
    productType: 'experience' as const,
    subType: 'journalist' as const,
    category: 'experience',
  },
  'experience-influencer': {
    label: '블로그 인플루언서',
    icon: Users,
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-600',
    detailPath: '/dashboard/experience/detail',
    productType: 'experience' as const,
    subType: 'influencer' as const,
    category: 'experience',
  },
};

// 카테고리별 세부 상품 매핑
export const categoryProducts: Record<string, string[]> = {
  all: [],
  reward: ['place'],
  review: ['receipt', 'kakaomap'],
  experience: [
    'experience-blog',
    'experience-xiaohongshu',
    'experience-journalist',
    'experience-influencer',
  ],
  blog: ['blog-video', 'blog-automation', 'blog-reviewer'],
  cafe: ['cafe'],
};

// 상태 설정
export const statusConfig: Record<
  SubmissionStatus | 'script_writing' | 'script_completed',
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: '확인중', variant: 'outline' },
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
  as_in_progress: { label: 'AS 진행 중', variant: 'default' },
  script_writing: { label: '원고작성중', variant: 'outline' },
  script_completed: { label: '원고작업완료', variant: 'default' },
};

