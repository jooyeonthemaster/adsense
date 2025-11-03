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
  LayoutDashboard,
  Package,
  FileText,
  DollarSign,
  HelpCircle,
  LogOut,
  Menu,
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '상품 접수', href: '/dashboard/submit', icon: Package },
  { name: '접수 내역', href: '/dashboard/submissions', icon: FileText },
  { name: '포인트 내역', href: '/dashboard/points', icon: DollarSign },
  { name: 'AS 신청', href: '/dashboard/as-request', icon: HelpCircle },
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
            <span className="text-base sm:text-lg font-bold">A</span>
          </div>
          <span className="text-base sm:text-lg font-semibold">애드센스</span>
        </div>
      </div>

      <div className="border-b border-slate-800 p-3 sm:p-4">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-slate-400">거래처</p>
          <p className="text-sm sm:text-base font-semibold">{user.name}</p>
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
            <span className="text-xs sm:text-sm font-medium">
              {user.points.toLocaleString()} P
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2.5 sm:px-3 py-3 sm:py-4">
        {navigation.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
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
          className="w-full justify-start text-xs sm:text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 z-50 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-100">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-slate-800">
            <SheetHeader className="sr-only">
              <SheetTitle>거래처 메뉴</SheetTitle>
            </SheetHeader>
            <div className="flex h-screen flex-col text-slate-100">
              <NavContent user={user} onClose={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-4">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-base font-bold">A</span>
          </div>
          <span className="text-base font-semibold text-slate-100">애드센스</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen w-64 flex-col bg-slate-900 text-slate-100">
        <NavContent user={user} />
      </div>
    </>
  );
}
