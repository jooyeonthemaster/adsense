'use client';

import { BulkSubmissionTab } from '@/components/dashboard/bulk-submission';

export default function ReviewBulkPage() {
  return (
    <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">영수증 리뷰 대량 접수</h1>
          <p className="mt-1 text-sm text-gray-500">
            엑셀 파일로 여러 건의 영수증 리뷰를 한 번에 접수할 수 있습니다.
          </p>
        </div>
        <BulkSubmissionTab productType="receipt" />
      </div>
    </div>
  );
}
