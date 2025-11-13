'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Flower2, Newspaper, Users } from 'lucide-react';

const tabs = [
  {
    name: '블로그',
    href: '/dashboard/experience/blog',
    icon: BookOpen,
  },
  {
    name: '샤오홍슈',
    href: '/dashboard/experience/xiaohongshu',
    icon: Flower2,
  },
  {
    name: '실계정 기자단',
    href: '/dashboard/experience/journalist',
    icon: Newspaper,
  },
  {
    name: '블로그 인플루언서',
    href: '/dashboard/experience/influencer',
    icon: Users,
  },
];

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {/* 탭 네비게이션 */}
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

      {/* 페이지 컨텐츠 */}
      {children}
    </div>
  );
}
