'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

// 서비스 ID와 product_categories slug 매핑
const serviceMapping = [
  { id: 'blog', slug: 'blog-experience', name: '블로그 체험단' },
  { id: 'xiaohongshu', slug: 'xiaohongshu', name: '샤오홍슈 체험단' },
  { id: 'reporter', slug: 'journalist', name: '실계정 기자단' },
  { id: 'influencer', slug: 'influencer', name: '블로그 인플루언서' },
];

// 체험단 마케팅 메인 페이지 - 활성화된 첫 번째 서비스로 리다이렉트
export default function ExperiencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [noAvailableService, setNoAvailableService] = useState(false);

  useEffect(() => {
    const checkAvailableService = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success && data.activeProducts) {
          // 활성화된(is_active=true) 첫 번째 서비스 찾기
          const availableService = serviceMapping.find(
            (service) => data.activeProducts.includes(service.slug)
          );

          if (availableService) {
            router.replace(`/dashboard/experience/${availableService.id}`);
          } else {
            // 모든 서비스가 숨김 처리됨
            setNoAvailableService(true);
            setLoading(false);
          }
        } else {
          setNoAvailableService(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('가격 정보 로드 실패:', error);
        setNoAvailableService(true);
        setLoading(false);
      }
    };

    checkAvailableService();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 모든 서비스가 비활성화된 경우
  if (noAvailableService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              현재 이용 가능한 서비스가 없습니다
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              체험단 마케팅 서비스가 준비 중입니다.
              <br />
              다른 서비스를 이용해 주세요.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
