'use client';

import { useState } from 'react';
import { FileSpreadsheet, ClipboardList } from 'lucide-react';
import { BulkSubmissionTab } from './BulkSubmissionTab';
import type { BulkSubmissionProduct } from './types';
import { cn } from '@/lib/utils';

interface SubmissionPageWrapperProps {
  productType: BulkSubmissionProduct;
  children: React.ReactNode;
  showBulkTab?: boolean;
}

/**
 * 접수 페이지 래퍼 - 개별 접수와 대량 접수 탭을 제공
 */
export function SubmissionPageWrapper({
  productType,
  children,
  showBulkTab = true,
}: SubmissionPageWrapperProps) {
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>('individual');

  if (!showBulkTab) {
    return <>{children}</>;
  }

  return (
    <>
      {/* 탭 헤더 */}
      <div className="border-b bg-gray-50/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex h-12">
            <button
              type="button"
              onClick={() => setActiveTab('individual')}
              className={cn(
                'flex items-center gap-2 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'individual'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <ClipboardList className="w-4 h-4" />
              개별 접수
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={cn(
                'flex items-center gap-2 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'bulk'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <FileSpreadsheet className="w-4 h-4" />
              대량 접수
            </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      {activeTab === 'individual' ? (
        children
      ) : (
        <div className="min-h-screen bg-white px-3 sm:px-4 lg:px-6 pt-4 pb-6">
          <div className="max-w-3xl mx-auto">
            <BulkSubmissionTab productType={productType} />
          </div>
        </div>
      )}
    </>
  );
}
