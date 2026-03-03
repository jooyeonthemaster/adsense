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
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// 네비게이션 메뉴 구조 (토글형 사이드바)
// - 대분류: 토글로 접기/펼치기, 처음에는 접혀있음
// - 하위 탭: 각 카테고리의 세부 페이지 링크
const navigationSections = [
  {
    id: 'reward',
    title: '리워드',
    icon: '/icon/place.svg',
    pathPrefix: '/dashboard/reward',
    children: [
      { name: '리워드 접수', href: '/dashboard/reward/submit' },
      { name: '접수 현황 확인', href: '/dashboard/submissions?category=reward' },
    ],
  },
  {
    id: 'review',
    title: '리뷰 마케팅',
    icon: '/icon/review.svg',
    pathPrefix: '/dashboard/review',
    children: [
      { name: '영수증 리뷰', href: '/dashboard/review/visitor' },
      { name: '카카오맵 리뷰', href: '/dashboard/review/kmap' },
    ],
  },
  {
    id: 'experience',
    title: '체험단 마케팅',
    icon: '/icon/experience.svg',
    pathPrefix: '/dashboard/experience',
    children: [
      { name: '블로그 체험단', href: '/dashboard/experience/blog' },
      { name: '샤오홍슈', href: '/dashboard/experience/xiaohongshu' },
      { name: '블로그 기자단', href: '/dashboard/experience/journalist' },
      { name: '블로그 인플루언서', href: '/dashboard/experience/influencer' },
    ],
  },
  {
    id: 'blog-distribution',
    title: '블로그 배포',
    icon: '/icon/blog.svg',
    pathPrefix: '/dashboard/blog-distribution',
    children: [
      { name: '247 영상 배포', href: '/dashboard/blog-distribution/video' },
      { name: '자동화 배포', href: '/dashboard/blog-distribution/auto' },
      { name: '리뷰어 배포', href: '/dashboard/blog-distribution/reviewer' },
    ],
  },
  {
    id: 'infiltration',
    title: '침투 마케팅',
    icon: '/icon/caffe.svg',
    pathPrefix: '/dashboard/cafe',
    children: [
      { name: '카페 침투', href: '/dashboard/cafe' },
      { name: '커뮤니티 마케팅', href: '/dashboard/cafe?type=community' },
    ],
  },
];

interface ProfileAlert {
  missingFields: string[];
  message: string;
}

interface ClientNavProps {
  user: {
    name: string;
    points: number;
  };
  profileAlert?: ProfileAlert;
}

function NavContent({
  user,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  profileAlert,
}: {
  user: ClientNavProps['user'];
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  profileAlert?: ProfileAlert;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showProfileTutorial, setShowProfileTutorial] = useState(true);

  // 토글 상태: 현재 pathname에 해당하는 섹션만 기본 열림
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationSections.forEach((section) => {
      // 현재 경로가 해당 섹션의 pathPrefix에 매칭되면 열어둠
      // 리워드의 접수현황 확인은 submissions 페이지이므로 별도 체크
      const isInSection = pathname?.startsWith(section.pathPrefix) ||
        section.children.some((child) => pathname === child.href || pathname?.startsWith(child.href.split('?')[0]));
      initial[section.id] = !!isInSection;
    });
    return initial;
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
              {profileAlert ? (
                <Button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 font-medium px-3 py-1.5 rounded-lg text-xs h-8 cursor-not-allowed"
                >
                  충전하기
                </Button>
              ) : (
                <Link href="/dashboard/points" onClick={() => onClose?.()} className="block">
                  <Button
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs h-8"
                  >
                    충전하기
                  </Button>
                </Link>
              )}
              {profileAlert ? (
                <Button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 font-medium px-3 py-1.5 rounded-lg text-xs h-8 cursor-not-allowed flex items-center justify-center"
                >
                  통합 접수 현황
                </Button>
              ) : (
                <Link href="/dashboard/submissions" onClick={() => onClose?.()} className="block">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs h-8 flex items-center justify-center"
                  >
                    통합 접수 현황
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/notifications" onClick={() => onClose?.()} className="block">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-3 py-1.5 rounded-lg text-xs h-8 flex items-center justify-center gap-1.5"
                >
                  <Bell className="h-3.5 w-3.5" />
                  공지사항 / 알림
                </Button>
              </Link>

              {/* 프로필 미완성 튜토리얼 안내 */}
              {profileAlert && showProfileTutorial && (
                <div className="mt-3 relative">
                  {/* 말풍선 꼬리 */}
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-amber-50 border-l border-t border-amber-200 transform rotate-45" />

                  <div className="relative bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
                    <button
                      onClick={() => setShowProfileTutorial(false)}
                      className="absolute top-2 right-2 text-amber-400 hover:text-amber-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-start gap-2 pr-4">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-amber-800">
                          {profileAlert.message}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {profileAlert.missingFields.map((field) => (
                            <span
                              key={field}
                              className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                        <Link
                          href="/dashboard/notifications?tab=mypage"
                          onClick={() => onClose?.()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                        >
                          마이페이지에서 입력하기
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

      {/* 메인 네비게이션 - 토글형 사이드바 */}
      <nav className="flex-1 overflow-y-auto py-2 pl-3 pr-2 space-y-0.5">
        <TooltipProvider delayDuration={300}>
          {navigationSections.map((section) => {
            const isSectionActive = pathname?.startsWith(section.pathPrefix) ||
              section.children.some((child) => pathname === child.href.split('?')[0] || pathname?.startsWith(child.href.split('?')[0] + '/'));
            const isExpanded = expandedSections[section.id] ?? false;
            const isDisabled = !!profileAlert;

            // 접힌 사이드바: 아이콘만 표시 + 툴팁
            if (isCollapsed) {
              const collapsedContent = isDisabled ? (
                <div
                  className="flex items-center justify-center py-2.5 mx-1 cursor-not-allowed opacity-50"
                >
                  <div className="w-5 h-5 flex-shrink-0 relative opacity-60">
                    <Image src={section.icon} alt={section.title} fill className="object-contain" />
                  </div>
                </div>
              ) : (
                <Link
                  href={section.children[0].href}
                  onClick={() => onClose?.()}
                  className={cn(
                    'flex items-center justify-center py-2.5 mx-1 rounded-lg transition-colors',
                    isSectionActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                  )}
                >
                  <div className="w-5 h-5 flex-shrink-0 relative">
                    <Image
                      src={section.icon}
                      alt={section.title}
                      fill
                      className={cn(
                        "object-contain",
                        isSectionActive
                          ? "[filter:invert(28%)_sepia(97%)_saturate(3516%)_hue-rotate(216deg)_brightness(102%)_contrast(102%)]"
                          : "hover:[filter:invert(28%)_sepia(97%)_saturate(3516%)_hue-rotate(216deg)_brightness(102%)_contrast(102%)]"
                      )}
                    />
                  </div>
                </Link>
              );

              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>{collapsedContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{section.title}</p>
                    {isDisabled && (
                      <p className="text-xs text-amber-200 mt-1">프로필 완성 후 이용 가능</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            // 펼쳐진 사이드바: 토글형 대분류 + 하위 탭
            return (
              <div key={section.id}>
                {/* 대분류 토글 헤더 */}
                {isDisabled ? (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-not-allowed opacity-50 text-gray-400">
                    <div className="w-5 h-5 flex-shrink-0 relative opacity-60">
                      <Image src={section.icon} alt={section.title} fill className="object-contain" />
                    </div>
                    <span className="font-medium flex-1">{section.title}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors rounded-lg group',
                      isSectionActive
                        ? 'text-blue-600 font-bold'
                        : 'text-gray-700 hover:text-blue-600 hover:font-bold'
                    )}
                  >
                    <div className="w-5 h-5 flex-shrink-0 relative">
                      <Image
                        src={section.icon}
                        alt={section.title}
                        fill
                        className={cn(
                          "object-contain",
                          isSectionActive
                            ? "[filter:invert(28%)_sepia(97%)_saturate(3516%)_hue-rotate(216deg)_brightness(102%)_contrast(102%)]"
                            : "group-hover:[filter:invert(28%)_sepia(97%)_saturate(3516%)_hue-rotate(216deg)_brightness(102%)_contrast(102%)]"
                        )}
                      />
                    </div>
                    <span className={cn("flex-1 text-left", isSectionActive ? "font-bold" : "font-medium group-hover:font-bold")}>
                      {section.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                        isExpanded ? "rotate-0" : "-rotate-90",
                        isSectionActive ? "text-blue-500" : "text-gray-400 group-hover:text-blue-500"
                      )}
                    />
                  </button>
                )}

                {/* 하위 탭 목록 - 토글 펼침 시 표시 */}
                {isExpanded && !isDisabled && (
                  <div className="ml-7 pl-3 border-l border-gray-200 space-y-0.5 pb-1">
                    {section.children.map((child) => {
                      const childPath = child.href.split('?')[0];
                      const isChildActive = pathname === childPath || pathname?.startsWith(childPath + '/');

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => onClose?.()}
                          className={cn(
                            'block px-3 py-1.5 text-[13px] rounded-md transition-colors',
                            isChildActive
                              ? 'text-blue-600 font-bold'
                              : 'text-gray-500 hover:text-blue-600 hover:font-bold'
                          )}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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

export function ClientNav({ user, profileAlert }: ClientNavProps) {
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
              <NavContent user={user} onClose={() => setOpen(false)} profileAlert={profileAlert} />
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
        <NavContent user={user} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} profileAlert={profileAlert} />
      </div>
    </>
  );
}
