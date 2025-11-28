import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCheck } from 'lucide-react';
import { KmapSubmission } from '@/types/review/kmap-content';

interface ReviewHeaderProps {
  submission: KmapSubmission | null;
  contentCount: number;
  pendingCount: number;
  approvedCount: number;
  onBack: () => void;
  onBulkApprove: () => void;
  isProcessing: boolean;
}

export function ReviewHeader({
  submission,
  contentCount,
  pendingCount,
  approvedCount,
  onBack,
  onBulkApprove,
  isProcessing,
}: ReviewHeaderProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">콘텐츠 검수</h1>
          <p className="text-gray-600">
            {submission?.company_name} - 총 {contentCount}개 콘텐츠
          </p>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">검수대기</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">승인완료</p>
            <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          </div>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mt-4 pt-4 border-t">
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={onBulkApprove}
            disabled={isProcessing}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            전체 일괄 승인 ({pendingCount}건)
          </Button>
        </div>
      )}
    </div>
  );
}




