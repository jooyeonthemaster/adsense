'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

// 리뷰 마케팅 메인 페이지 - 활성화된 첫 번째 서비스로 리다이렉트
export default function ReviewMarketingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [noActiveProducts, setNoActiveProducts] = useState(false);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success && data.activeProducts) {
          // 리뷰 마케팅 상품 slug와 URL 매핑
          const reviewServices = [
            { slug: 'receipt-review', url: 'visitor' },
            { slug: 'kakaomap-review', url: 'kmap' },
          ];

          // 활성화된 첫 번째 리뷰 마케팅 상품 찾기
          const activeService = reviewServices.find(
            service => data.activeProducts.includes(service.slug)
          );

          if (activeService) {
            router.replace(`/dashboard/review/${activeService.url}`);
          } else {
            // 활성화된 리뷰 마케팅 상품이 없는 경우
            setNoActiveProducts(true);
            setIsLoading(false);
          }
        } else {
          // API 실패 시 기본값으로 visitor 페이지로 이동
          router.replace('/dashboard/review/visitor');
        }
      } catch (error) {
        console.error('상품 정보 로드 실패:', error);
        router.replace('/dashboard/review/visitor');
      }
    };

    fetchAndRedirect();
  }, [router]);

  if (noActiveProducts) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">현재 이용 가능한 서비스가 없습니다</h2>
          <p className="text-gray-600">리뷰 마케팅 서비스가 일시적으로 중단되었습니다.</p>
          <p className="text-gray-600">관리자에게 문의해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto mb-3" />
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    </div>
  );
}
