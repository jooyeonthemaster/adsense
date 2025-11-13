'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LogOut,
  Menu,
  ChevronDown,
  Gift,
  MessageSquare,
  Users,
  Coffee,
  FileText,
  Volume2,
} from 'lucide-react';
import Image from 'next/image';

// 네비게이션 메뉴 구조 (요구사항.txt 기준)
const navigationSections = [
  {
    id: 'reward',
    title: '리워드',
    icon: Gift,
    collapsible: true,
    items: [
      { name: '리워드 접수', href: '/dashboard/reward/submit', icon: Gift },
      { name: '접수 현황 확인', href: '/dashboard/reward/status', icon: Gift },
    ],
  },
  {
    id: 'review',
    title: '리뷰 마케팅',
    icon: MessageSquare,
    collapsible: true,
    items: [
      { name: '방문자 리뷰', href: '/dashboard/review/visitor', icon: MessageSquare },
      { name: 'K맵 리뷰', href: '/dashboard/review/kmap', icon: MessageSquare },
    ],
  },
  {
    id: 'experience',
    title: '체험단 마케팅',
    icon: Users,
    collapsible: true,
    items: [
      { name: '블로그', href: '/dashboard/experience/blog', icon: Users },
      { name: '샤오홍슈', href: '/dashboard/experience/xiaohongshu', icon: Users },
      { name: '실계정 기자단', href: '/dashboard/experience/journalist', icon: Users },
      { name: '블로그 인플루언서', href: '/dashboard/experience/influencer', icon: Users },
    ],
  },
  {
    id: 'blog-distribution',
    title: '블로그 배포',
    icon: FileText,
    collapsible: true,
    items: [
      { name: '영상 배포', href: '/dashboard/blog-distribution/video', icon: FileText },
      { name: '자동화 배포', href: '/dashboard/blog-distribution/auto', icon: FileText },
      { name: '리뷰어 배포', href: '/dashboard/blog-distribution/reviewer', icon: FileText },
    ],
  },
  {
    id: 'cafe',
    title: '카페침투 마케팅',
    icon: Coffee,
    collapsible: false,
    href: '/dashboard/cafe',
  },
];

interface ClientNavProps {
  user: {
    name: string;
    points: number;
  };
}

function NavContent({ user, onClose }: { user: ClientNavProps['user']; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<string[]>(['reward', 'review', 'experience', 'blog-distribution']);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <>
      {/* 캐릭터 + 사용자 정보 영역 */}
      <div className="border-b border-gray-200 p-6">
        {/* 로고 */}
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-48">
            <Image
              src="/logo.png"
              alt="마스코트"
              width={192}
              height={192}
              className="object-contain"
            />
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900">{user.name} 님</span>
            <span className="text-sm font-medium text-blue-600">실행사</span>
          </div>
        </div>

        {/* 포인트 + 충전하기 버튼 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-bold text-gray-900">{user.points.toLocaleString()}</span>
            <span className="text-lg text-gray-500 font-medium">P</span>
          </div>
          <Link href="/dashboard/points" onClick={() => onClose?.()}>
            <Button
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-5 py-2 rounded-lg text-sm"
            >
              충전하기
            </Button>
          </Link>
        </div>

        {/* 공지사항 · 개인알림 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Volume2 className="h-4 w-4" />
          <span>공지사항 · 개인알림</span>
        </div>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navigationSections.map((section) => {
          const SectionIcon = section.icon;

          // 카페침투 마케팅은 collapsible이 아닌 단일 링크
          if (!section.collapsible && 'href' in section && section.href) {
            const isActive = pathname === section.href || pathname?.startsWith(section.href + '/');

            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={() => onClose?.()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <SectionIcon className="h-5 w-5" />
                {section.title}
              </Link>
            );
          }

          // collapsible 섹션
          const isOpen = openSections.includes(section.id);

          return (
            <Collapsible
              key={section.id}
              open={isOpen}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <SectionIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">{section.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-gray-500 transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-gray-50">
                {section.items?.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  const ItemIcon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => onClose?.()}
                      className={cn(
                        'flex items-center gap-2 pl-11 pr-4 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      <ItemIcon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="border-t border-gray-200 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm text-gray-700 hover:bg-gray-100"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </>
  );
}

export function ClientNav({ user }: ClientNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-900">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-white border-gray-200">
            <SheetHeader className="sr-only">
              <SheetTitle>거래처 메뉴</SheetTitle>
            </SheetHeader>
            <div className="flex h-screen flex-col">
              <NavContent user={user} onClose={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-base font-semibold text-gray-900">마자무</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen w-72 flex-col bg-white border-r border-gray-200">
        <NavContent user={user} />
      </div>
    </>
  );
}