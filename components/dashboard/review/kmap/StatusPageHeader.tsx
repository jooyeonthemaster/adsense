import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export function StatusPageHeader() {
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">카카오맵 접수 현황</h1>
          </div>
          <p className="text-[11px] sm:text-sm text-amber-100 truncate">카카오맵 접수 내역 및 검수 상태를 관리하세요</p>
        </div>
        <Link href="/dashboard/review/kmap" className="flex-shrink-0">
          <Button variant="secondary" size="sm" className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
            새 접수
          </Button>
        </Link>
      </div>
    </div>
  );
}

