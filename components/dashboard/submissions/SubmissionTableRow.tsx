import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { ExternalLink, ChevronRight, Download, AlertTriangle, Loader2 } from 'lucide-react';
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

interface SubmissionTableRowProps {
  submission: UnifiedSubmission;
  onCancel: (submission: UnifiedSubmission) => void;
  onDownloadReport: (submission: UnifiedSubmission) => void;
  onAsRequest: (submission: UnifiedSubmission) => void;
  downloadingId?: string | null;
}

export function SubmissionTableRow({
  submission,
  onCancel,
  onDownloadReport,
  onAsRequest,
  downloadingId
}: SubmissionTableRowProps) {
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
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${productInfo.bgColor}`}>
            <ProductIcon className={`h-4 w-4 ${productInfo.textColor}`} />
          </div>
          <span className="text-sm">{productInfo.label}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{submission.company_name}</span>
          {submission.place_url && (
            <a
              href={submission.place_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-500 hover:text-sky-600"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        {submission.submission_number && (
          <p className="text-xs text-gray-500 font-mono">{submission.submission_number}</p>
        )}
      </TableCell>
      <TableCell className="text-sm text-gray-600">{getDetailInfo(submission)}</TableCell>
      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
        {formatOperationPeriod(submission.start_date, submission.end_date)}
      </TableCell>
      <TableCell>
        <div className="space-y-1.5">
          <Badge variant={statusDisplay.variant} className="text-xs">
            {statusDisplay.label}
          </Badge>
          {submission.status === 'in_progress' && progress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>진행률</span>
                <span className="font-medium">
                  {submission.current_day}/{submission.total_days}일
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">{formatDate(submission.created_at)}</TableCell>
      <TableCell className="text-sm font-semibold text-right">
        {submission.total_points.toLocaleString()}P
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <Link href={getDetailPagePath()}
          >
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 font-medium"
            >
              상세
            </Button>
          </Link>
          {canDownloadReport && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
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
            className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
            onClick={() => onAsRequest(submission)}
          >
            <AlertTriangle className="h-3 w-3" />
          </Button>
          {canCancel(submission) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(submission)}
              className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
            >
              중단
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
