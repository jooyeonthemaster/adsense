import { Coffee } from 'lucide-react';

export function CafeMarketingHeader() {
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
      <div className="flex items-center gap-2 mb-1">
        <Coffee className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
        <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">카페 침투 마케팅 관리</h1>
      </div>
      <p className="text-[11px] sm:text-sm text-amber-100 truncate">카페 마케팅 접수 관리</p>
    </div>
  );
}

