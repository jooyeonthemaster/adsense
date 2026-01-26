'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, MapPin, FileSpreadsheet } from 'lucide-react';

const tabs = [
  {
    name: '네이버 영수증',
    href: '/dashboard/review/visitor',
    icon: MessageSquare,
  },
  {
    name: '카카오맵',
    href: '/dashboard/review/kmap',
    icon: MapPin,
  },
  {
    name: '대량 접수',
    href: '/dashboard/review/bulk',
    icon: FileSpreadsheet,
  },
];

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 상태 조회 페이지에서는 탭 네비게이션을 숨김
  const isStatusPage = pathname?.includes('/status');

  return (
    <div className="space-y-4">
      {/* 탭 네비게이션 - 접수 폼 페이지에서만 표시 */}
      {!isStatusPage && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${
                        isActive
                          ? 'border-sky-500 text-sky-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        mr-2 h-5 w-5
                        ${isActive ? 'text-sky-500' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* 페이지 컨텐츠 */}
      {children}
    </div>
  );
}
