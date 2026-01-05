import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { UnifiedSubmission } from '@/types/submission';
import {
  getProductInfo,
  getStatusDisplay,
  calculateProgress,
  formatDate,
  getDetailInfo,
  canCancel,
} from '@/lib/submission-utils';

// 구동기간 포맷팅 (MM/DD ~ MM/DD)
const formatOperationPeriod = (startDate?: string, endDate?: string | null): string => {
  if (!startDate) return '-';

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const start = formatShortDate(startDate);
  if (!endDate) return `${start} ~`;

  return `${start} ~ ${formatShortDate(endDate)}`;
};

interface SubmissionCardProps {
  submission: UnifiedSubmission;
  onCancel: (submission: UnifiedSubmission) => void;
  onDownloadReport: (submission: UnifiedSubmission) => void;
  onAsRequest: (submission: UnifiedSubmission) => void;
  downloadingId?: string | null;
}

export function SubmissionCard({
  submission,
  onCancel,
  onDownloadReport,
  onAsRequest,
  downloadingId
}: SubmissionCardProps) {
  const productInfo = getProductInfo(submission);
  const ProductIcon = productInfo.icon;
  const statusDisplay = getStatusDisplay(submission);
  const progress = calculateProgress(submission);

  // 리포트 다운로드 가능 여부 (리워드, 체험단 제외)
  const canDownloadReport = !['place', 'experience'].includes(submission.product_type);

  // 상세 페이지 경로 결정 (/detail/ 경로가 필요한지 여부)
  const getDetailPagePath = () => {
    // /detail/ 경로가 있는 상품: blog, cafe
    const needsDetailPath = ['blog', 'cafe'].includes(submission.product_type);

    if (needsDetailPath) {
      return `${productInfo.detailPath}/detail/${submission.id}`;
    }

    // /detail/ 경로가 없는 상품: place, receipt, kakaomap, experience
    return `${productInfo.detailPath}/${submission.id}`;
  };

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
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
        <div className="col-span-2">
          <p className="text-xs text-gray-500">상세 정보</p>
          <p className="text-sm font-medium">{getDetailInfo(submission)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">구동기간</p>
          <p className="text-sm font-medium">{formatOperationPeriod(submission.start_date, submission.end_date)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">접수일시</p>
          <p className="text-sm font-medium">{formatDate(submission.created_at)}</p>
        </div>
        <div className="col-span-2 text-right">
          <p className="text-xs text-gray-500">총 비용</p>
          <p className="text-sm font-semibold text-sky-600">
            {submission.total_points.toLocaleString()}P
          </p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-1.5 pt-2">
        <Link
          href={getDetailPagePath()}
          className="flex-1"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 text-blue-600 border-blue-300 hover:bg-blue-50 font-medium"
          >
            상세
          </Button>
        </Link>
        {canDownloadReport && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 text-green-600 border-green-300 hover:bg-green-50 px-2"
            onClick={() => onDownloadReport(submission)}
            disabled={downloadingId === submission.id}
          >
            {downloadingId === submission.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 text-amber-600 border-amber-300 hover:bg-amber-50 px-2"
          onClick={() => onAsRequest(submission)}
        >
          <AlertTriangle className="h-3 w-3" />
        </Button>
        {canCancel(submission) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(submission)}
            className="flex-1 text-xs h-8 text-red-600 border-red-300 hover:bg-red-50"
          >
            중단
          </Button>
        )}
      </div>
    </div>
  );
}
