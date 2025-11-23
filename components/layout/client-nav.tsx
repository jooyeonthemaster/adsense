'use client';

import { useState, useEffect } from 'react';
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
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// 네비게이션 메뉴 구조 (요구사항.txt 기준)
const navigationSections = [
  {
    id: 'reward',
    title: '리워드',
    icon: Gift,
    collapsible: true,
    items: [
      { name: '리워드 접수', href: '/dashboard/reward/submit', icon: Gift },
      { name: '접수 현황 확인', href: '/dashboard/reward/status', icon: ClipboardList },
    ],
  },
  {
    id: 'review',
    title: '리뷰 마케팅',
    icon: MessageSquare,
    collapsible: true,
    items: [
      { name: '네이버 영수증', href: '/dashboard/review/visitor', icon: MessageSquare },
      { name: '네이버 영수증 접수 현황', href: '/dashboard/review/visitor/status', icon: ClipboardList },
      { name: '카카오맵', href: '/dashboard/review/kmap', icon: MessageSquare },
      { name: '카카오맵 접수 현황', href: '/dashboard/review/kmap/status', icon: ClipboardList },
    ],
  },
  {
    id: 'experience',
    title: '체험단 마케팅',
    icon: Users,
    collapsible: true,
    items: [
      { name: '블로그 체험단', href: '/dashboard/experience/blog', icon: Users },
      { name: '샤오홍슈(중국인 체험단)', href: '/dashboard/experience/xiaohongshu', icon: Users },
      { name: '블로그 기자단', href: '/dashboard/experience/journalist', icon: Users },
      { name: '블로그 인플루언서', href: '/dashboard/experience/influencer', icon: Users },
      { name: '체험단 접수 현황', href: '/dashboard/experience/status', icon: ClipboardList },
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
      { name: '블로그 배포 접수 현황', href: '/dashboard/blog-distribution/status', icon: ClipboardList },
    ],
  },
  {
    id: 'cafe',
    title: '카페침투 마케팅',
    icon: Coffee,
    collapsible: true,
    items: [
      { name: '카페 마케팅 접수', href: '/dashboard/cafe', icon: Coffee },
      { name: '카페 마케팅 접수 현황', href: '/dashboard/cafe/status', icon: ClipboardList },
    ],
  },
];

interface ClientNavProps {
  user: {
    name: string;
    points: number;
  };
}

function NavContent({
  user,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: {
  user: ClientNavProps['user'];
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
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
      <div className="border-b border-gray-200 p-4 relative">
        {/* 접기 버튼 - 우측 상단 */}
        {onToggleCollapse && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {!isCollapsed ? (
          <>
            {/* 로고 - 클릭 시 공지사항 페이지로 이동 */}
            <Link href="/dashboard/notifications" onClick={() => onClose?.()} className="block">
              <div className="flex justify-center mb-3 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="relative w-32 h-32">
                  <Image
                    src="/logo.png"
                    alt="마스코트"
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
              </div>
            </Link>

            {/* 사용자 정보 */}
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base font-bold text-gray-900 truncate">{user.name} 님</span>
                <span className="text-xs font-medium text-blue-600 flex-shrink-0">실행사</span>
              </div>
            </div>

            {/* 포인트 + 충전하기 버튼 */}
            <div className="space-y-2">
              <div className="flex items-center gap-0.5">
                <span className="text-2xl font-bold text-gray-900">{user.points.toLocaleString()}</span>
                <span className="text-base text-gray-500 font-medium">P</span>
              </div>
              <Link href="/dashboard/points" onClick={() => onClose?.()} className="block">
                <Button
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs h-8"
                >
                  충전하기
                </Button>
              </Link>
              <Link href="/dashboard/submissions" onClick={() => onClose?.()} className="block">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs h-8 flex items-center justify-center gap-1.5"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  통합 접수 현황
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* 펼치기 버튼 - 접힌 상태 */}
            {onToggleCollapse && (
              <div className="flex justify-center mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={onToggleCollapse}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Link href="/dashboard/notifications" onClick={() => onClose?.()} className="block">
              <div className="flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.png"
                    alt="마스코트"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 overflow-y-auto py-1.5">
        <TooltipProvider delayDuration={300}>
          {navigationSections.map((section) => {
            const SectionIcon = section.icon;

            // 카페침투 마케팅은 collapsible이 아닌 단일 링크
            if (!section.collapsible && 'href' in section && section.href) {
              const isActive = pathname === section.href || pathname?.startsWith(section.href + '/');

              const linkContent = (
                <Link
                  key={section.id}
                  href={section.href}
                  onClick={() => onClose?.()}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-xs transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <SectionIcon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && section.title}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={section.id}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{section.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            }

            // collapsible 섹션
            const isOpen = openSections.includes(section.id);

            if (isCollapsed) {
              // collapsed 상태에서는 서브메뉴를 아이콘 클릭 시 tooltip으로 표시
              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>
                    <div className="px-3 py-2 flex justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                      <SectionIcon className="h-4 w-4 text-blue-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="p-0">
                    <div className="py-1">
                      <p className="px-3 py-1.5 text-xs font-semibold text-gray-500">{section.title}</p>
                      {section.items?.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        const ItemIcon = item.icon;

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => onClose?.()}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 text-xs transition-colors w-48',
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            <ItemIcon className="h-3.5 w-3.5" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Collapsible
                key={section.id}
                open={isOpen}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <SectionIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-900">{section.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-gray-500 transition-transform flex-shrink-0',
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
                          'flex items-center gap-1.5 pl-8 pr-3 py-1.5 text-xs transition-colors',
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        <ItemIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* 로그아웃 */}
      <div className="border-t border-gray-200 p-2">
        {!isCollapsed ? (
          <Button
            variant="ghost"
            className="w-full justify-start text-xs text-gray-700 hover:bg-gray-100 h-8"
            onClick={handleLogout}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            로그아웃
          </Button>
        ) : (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-xs text-gray-700 hover:bg-gray-100 h-8 px-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>로그아웃</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </>
  );
}

export function ClientNav({ user }: ClientNavProps) {
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // localStorage에서 사이드바 상태 불러오기
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // 사이드바 토글 및 localStorage에 저장
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

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
      <div
        className={cn(
          'hidden lg:flex h-screen flex-col bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        <NavContent user={user} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      </div>
    </>
  );
}