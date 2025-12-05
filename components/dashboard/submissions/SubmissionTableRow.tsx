import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { ExternalLink, ChevronRight } from 'lucide-react';
import { UnifiedSubmission } from '@/types/submission';
import {
  getProductInfo,
  getStatusDisplay,
  calculateProgress,
  formatDate,
  getDetailInfo,
  canCancel,
} from '@/lib/submission-utils';

interface SubmissionTableRowProps {
  submission: UnifiedSubmission;
  onCancel: (submission: UnifiedSubmission) => void;
}

export function SubmissionTableRow({ submission, onCancel }: SubmissionTableRowProps) {
  const productInfo = getProductInfo(submission);
  const ProductIcon = productInfo.icon;
  const statusDisplay = getStatusDisplay(submission);
  const progress = calculateProgress(submission);

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
        <div className="flex items-center justify-center gap-2">
          <Link
            href={
              productInfo.category === 'experience'
                ? `${productInfo.detailPath}/${submission.id}`
                : `${productInfo.detailPath}?id=${submission.id}`
            }
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 font-medium"
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
              className="h-8 text-xs text-red-600 border-red-300 hover:bg-red-50"
            >
              중단
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

