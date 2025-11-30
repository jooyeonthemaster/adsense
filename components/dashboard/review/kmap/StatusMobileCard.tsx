import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ChevronRight, AlertTriangle } from 'lucide-react';
import { KAKAOMAP_STATUS_LABELS } from '@/config/kakaomap-status';
import { KakaomapSubmission } from '@/types/review/kmap-status';
import { calculateProgress, formatDate, canCancelSubmission } from '@/utils/review/kmap-status-helpers';

interface StatusMobileCardProps {
  submission: KakaomapSubmission;
  onViewContent: (submission: KakaomapSubmission) => void;
  onOpenMessages: (submission: KakaomapSubmission) => void;
  onCancelClick: (submission: KakaomapSubmission) => void;
  onAsConditionClick?: () => void;
}

export function StatusMobileCard({
  submission,
  onViewContent,
  onOpenMessages,
  onCancelClick,
  onAsConditionClick,
}: StatusMobileCardProps) {
  const statusDisplay = KAKAOMAP_STATUS_LABELS[submission.status as keyof typeof KAKAOMAP_STATUS_LABELS] || { 
    label: submission.status, 
    variant: 'outline' as const 
  };
  const progress = calculateProgress(submission);

  return (
    <div className="bg-white border rounded-lg p-2.5 space-y-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-xs truncate flex-1 min-w-0">{submission.company_name}</h3>
        <Badge variant={statusDisplay.variant} className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
          {statusDisplay.label}
        </Badge>
      </div>
      {(submission.has_photo || submission.script_confirmed) && (
        <div className="flex items-center gap-1.5">
          {submission.has_photo && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
              사진 O
            </Badge>
          )}
          {submission.script_confirmed && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200">
              원고 O
            </Badge>
          )}
        </div>
      )}
      {submission.status !== 'cancelled' ? (
        <div className="space-y-0.5">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                submission.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-gray-500">진행률: {progress.toFixed(0)}%</p>
        </div>
      ) : (
        <p className="text-[10px] text-gray-400">중단됨</p>
      )}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
        <div>
          <p className="text-[10px] text-gray-500 mb-0.5">업로드/총 건수</p>
          <p className="text-xs font-medium">
            {submission.content_items_count || 0}건 / {submission.total_count}건
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-0.5">접수일</p>
          <p className="text-xs font-medium">{formatDate(submission.created_at)}</p>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap pt-1">
        <Link href={`/dashboard/review/kmap/status/${submission.id}`} className="flex-1 min-w-[100px]">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-[11px] h-7 text-blue-600 border-blue-300 hover:bg-blue-50 font-medium px-2"
          >
            상세
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </Link>
        
        {['review', 'revision_requested'].includes(submission.status) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewContent(submission)}
            className="flex-1 min-w-[100px] text-[11px] h-7 text-amber-600 border-amber-300 px-2"
          >
            검수
          </Button>
        )}
        {submission.status === 'in_progress' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenMessages(submission)}
            className="flex-1 min-w-[100px] text-[11px] h-7 text-blue-600 border-blue-300 px-2"
          >
            <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
            문의
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-w-[100px] text-[11px] h-7 text-amber-600 border-amber-300 px-2"
          onClick={() => {
            if (submission.status === 'completed') {
              window.location.href = `/dashboard/as-request?submission_id=${submission.id}&type=kakaomap`;
            } else if (onAsConditionClick) {
              onAsConditionClick();
            }
          }}
        >
          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
          AS신청
        </Button>
        {canCancelSubmission(submission) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancelClick(submission)}
            className="flex-1 min-w-[100px] text-[11px] h-7 text-red-600 border-red-300 px-2"
          >
            중단
          </Button>
        )}
      </div>
    </div>
  );
}

