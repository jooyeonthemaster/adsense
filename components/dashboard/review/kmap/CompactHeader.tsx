import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { KmapSubmission } from '@/types/review/kmap-content';

interface CompactHeaderProps {
  submission: KmapSubmission | null;
  pendingCount: number;
  approvedCount: number;
  onBack: () => void;
}

export function CompactHeader({
  submission,
  pendingCount,
  approvedCount,
  onBack,
}: CompactHeaderProps) {
  return (
    <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* 좌측: 뒤로가기 + 업체명 */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold leading-tight">{submission?.company_name}</h1>
            <p className="text-xs text-muted-foreground">콘텐츠 검수</p>
          </div>
        </div>

        {/* 우측: 통계 배지 */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            대기 {pendingCount}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            승인 {approvedCount}
          </Badge>
        </div>
      </div>
    </div>
  );
}
