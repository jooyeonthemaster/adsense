'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  Package,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  Menu,
  Sparkles,
  Star,
  Newspaper,
  Coffee,
  Gift,
  Megaphone,
  Database,
  Receipt,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/admin', icon: LayoutDashboard },
  // { name: '데이터 분석', href: '/admin/analytics', icon: BarChart3 }, // 숨김 처리
  { name: '거래처 관리', href: '/admin/clients', icon: Users },
  // { name: '상품 관리', href: '/admin/products', icon: Package }, // [DISABLED 2025-11-02] 4가지 고정 상품만 사용
  { name: '접수 내역', href: '/admin/submissions', icon: FileText },
  { name: '블로그 배포', href: '/admin/blog-distribution', icon: Newspaper },
  { name: '카페 침투', href: '/admin/cafe-marketing', icon: Coffee },
  { name: '리뷰 마케팅', href: '/admin/review-marketing', icon: Star },
  { name: '리워드 관리', href: '/admin/reward', icon: Gift },
  { name: '체험단 관리', href: '/admin/experience', icon: Sparkles },
  { name: '포인트 관리', href: '/admin/points', icon: DollarSign },
  { name: '세금계산서 요청', href: '/admin/tax-invoice-requests', icon: Receipt },
  { name: 'AS & 중단 요청', href: '/admin/as-requests', icon: Settings },
  { name: '공지사항 관리', href: '/admin/announcements', icon: Megaphone },
  { name: '전체 상품 설정', href: '/admin/product-guides', icon: Package },
  { name: '데이터 관리', href: '/admin/data-management', icon: Database },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

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
      <div className="flex h-14 sm:h-16 items-center justify-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-base sm:text-lg font-bold">M</span>
          </div>
          <span className="text-base sm:text-lg font-semibold">마자무</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 sm:px-3 py-3 sm:py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => onClose?.()}
              className={cn(
                'flex items-center gap-2 sm:gap-3 rounded-md px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3 sm:p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white h-9 sm:h-10 text-xs sm:text-sm"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
          로그아웃
        </Button>
      </div>
    </>
  );
}

export function AdminNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-100 hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-slate-800">
            <SheetHeader className="sr-only">
              <SheetTitle>관리자 메뉴</SheetTitle>
            </SheetHeader>
            <div className="flex h-screen flex-col text-slate-100">
              <NavContent onClose={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-4">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-base font-bold">M</span>
          </div>
          <span className="text-base font-semibold text-slate-100">마자무</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen w-64 flex-col bg-slate-900 text-slate-100">
        <NavContent />
      </div>
    </>
  );
}
