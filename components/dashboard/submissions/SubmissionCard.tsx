import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { UnifiedSubmission } from '@/types/submission';
import {
  getProductInfo,
  getStatusDisplay,
  calculateProgress,
  formatDate,
  getDetailInfo,
  canCancel,
} from '@/lib/submission-utils';
import { ChevronRight } from 'lucide-react';

interface SubmissionCardProps {
  submission: UnifiedSubmission;
  onCancel: (submission: UnifiedSubmission) => void;
}

export function SubmissionCard({ submission, onCancel }: SubmissionCardProps) {
  const productInfo = getProductInfo(submission);
  const ProductIcon = productInfo.icon;
  const statusDisplay = getStatusDisplay(submission);
  const progress = calculateProgress(submission);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded ${productInfo.bgColor}`}>
              <ProductIcon className={`h-4 w-4 ${productInfo.textColor}`} />
            </div>
            <span className="text-xs font-medium text-gray-600">{productInfo.label}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{submission.company_name}</h3>
            {submission.place_url && (
              <a
                href={submission.place_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {submission.submission_number && (
            <p className="text-xs text-gray-500 font-mono">{submission.submission_number}</p>
          )}
        </div>
        <Badge variant={statusDisplay.variant} className="text-xs">
          {statusDisplay.label}
        </Badge>
      </div>

      {/* 진행률 */}
      {submission.status === 'in_progress' && progress > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>진행률</span>
            <span className="font-medium">
              {submission.current_day}/{submission.total_days}일
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* 상세 정보 */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">상세 정보</p>
          <p className="text-sm font-medium">{getDetailInfo(submission)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">접수일시</p>
          <p className="text-sm font-medium">{formatDate(submission.created_at)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-500">총 비용</p>
          <p className="text-sm font-semibold text-sky-600">
            {submission.total_points.toLocaleString()}P
          </p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 pt-2">
        <Link
          href={
            productInfo.category === 'experience'
              ? `${productInfo.detailPath}/${submission.id}`
              : `${productInfo.detailPath}?id=${submission.id}`
          }
          className="flex-1"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-9 text-blue-600 border-blue-300 hover:bg-blue-50 font-medium"
          >
            상세보기
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
        {canCancel(submission) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(submission)}
            className="flex-1 text-xs h-9 text-red-600 border-red-300 hover:bg-red-50"
          >
            중단 신청
          </Button>
        )}
      </div>
    </div>
  );
}

