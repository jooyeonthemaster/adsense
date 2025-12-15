'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 블로그 배포 메인 페이지 - 기본 타입으로 리다이렉트
export default function BlogDistributionPage() {
  const router = useRouter();

  useEffect(() => {
    // 기본값으로 일반 블로그 배포 페이지로 리다이렉트
    router.replace('/dashboard/blog-distribution/blog');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-3" />
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    </div>
  );
}
