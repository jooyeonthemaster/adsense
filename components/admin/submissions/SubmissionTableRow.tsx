import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Eye, ExternalLink, Copy, Check, Link2 } from 'lucide-react';
import { UnifiedSubmission, STATUS_LABELS, STATUS_VARIANTS, TYPE_LABELS } from '@/types/admin/submissions';
import { formatDate, getSubmissionDetails } from '@/utils/admin/submission-helpers';

// 구동기간 포맷팅 (MM/DD ~ MM/DD)
const formatOperationPeriod = (startDate?: string, endDate?: string): string => {
  if (!startDate) return '-';

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const start = formatShortDate(startDate);
  if (!endDate) return `${start} ~`;

  return `${start} ~ ${formatShortDate(endDate)}`;
};

// 상품 타입별 관리 페이지 URL 매핑
const getManagementUrl = (type: UnifiedSubmission['type'], id: string): string => {
  const urlMap: Record<UnifiedSubmission['type'], string> = {
    place: `/admin/reward/${id}`,
    receipt: `/admin/review-marketing/visitor/${id}`,
    kakaomap: `/admin/kakaomap/${id}`,
    blog: `/admin/blog-distribution/${id}`,
    cafe: `/admin/cafe-marketing/${id}`,
    experience: `/admin/experience/${id}`,
  };
  return urlMap[type];
};

interface SubmissionTableRowProps {
  submission: UnifiedSubmission;
  onOpenDetail: (id: string, type: UnifiedSubmission['type']) => void;
}

export function SubmissionTableRow({
  submission,
  onOpenDetail,
}: SubmissionTableRowProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (submissionNumber: string) => {
    try {
      await navigator.clipboard.writeText(submissionNumber);
      setCopiedId(submissionNumber);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm">
        {formatDate(submission.created_at)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {submission.submission_number ? (
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs">{submission.submission_number}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => copyToClipboard(submission.submission_number!)}
            >
              {copiedId === submission.submission_number ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="font-medium">
        {submission.clients?.company_name || '-'}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant="outline">
          {TYPE_LABELS[submission.type] || submission.type}
        </Badge>
      </TableCell>
      <TableCell className="font-medium truncate max-w-[120px]">
        {submission.company_name || '-'}
      </TableCell>
      <TableCell className="text-center">
        {submission.place_url ? (
          <a
            href={submission.place_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-blue-600"
            title={submission.place_url}
          >
            <Link2 className="h-4 w-4" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm">
        {formatOperationPeriod(submission.start_date, submission.end_date)}
      </TableCell>
      <TableCell className="text-sm truncate max-w-[150px]">
        {getSubmissionDetails(submission)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {submission.progress_percentage !== undefined ? (
          <div className="flex items-center gap-1">
            <div className="h-2 w-10 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(submission.progress_percentage, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {submission.progress_percentage}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right font-semibold whitespace-nowrap">
        {submission.total_points.toLocaleString()} P
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant={STATUS_VARIANTS[submission.status] || 'outline'} className="text-xs">
          {STATUS_LABELS[submission.status] || submission.status}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.05)] z-10">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenDetail(submission.id, submission.type)}
            className="h-7 px-2"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-7 px-2"
          >
            <Link href={getManagementUrl(submission.type, submission.id)}>
              관리
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}














