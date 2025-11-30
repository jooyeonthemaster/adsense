import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { ExternalLink, ImageIcon, FileText, MessageSquare, ChevronRight, AlertTriangle } from 'lucide-react';
import { KAKAOMAP_STATUS_LABELS } from '@/config/kakaomap-status';
import { KakaomapSubmission } from '@/types/review/kmap-status';
import { calculateProgress, formatDate, canCancelSubmission } from '@/utils/review/kmap-status-helpers';

interface StatusTableRowProps {
  submission: KakaomapSubmission;
  onViewContent: (submission: KakaomapSubmission) => void;
  onOpenMessages: (submission: KakaomapSubmission) => void;
  onCancelClick: (submission: KakaomapSubmission) => void;
  onAsConditionClick?: () => void;
}

export function StatusTableRow({
  submission,
  onViewContent,
  onOpenMessages,
  onCancelClick,
  onAsConditionClick,
}: StatusTableRowProps) {
  const statusDisplay = KAKAOMAP_STATUS_LABELS[submission.status as keyof typeof KAKAOMAP_STATUS_LABELS] || { 
    label: submission.status, 
    variant: 'outline' as const 
  };
  const progress = calculateProgress(submission);

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium text-sm">
        <div className="flex items-center gap-2">
          {submission.company_name}
          {submission.kakaomap_url && (
            <a
              href={submission.kakaomap_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-500"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm">
        <div className="flex items-center gap-1">
          <span className="font-medium text-amber-600">{submission.content_items_count || 0}</span>
          <span className="text-gray-400">/</span>
          <span>{submission.total_count}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {submission.has_photo && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              <ImageIcon className="h-3 w-3 mr-1" />
              사진
            </Badge>
          )}
          {submission.script_confirmed && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              <FileText className="h-3 w-3 mr-1" />
              원고
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusDisplay.variant} className="text-xs">
          {statusDisplay.label}
        </Badge>
      </TableCell>
      <TableCell>
        {submission.status !== 'cancelled' ? (
          <div className="space-y-1">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  submission.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{progress.toFixed(0)}%</p>
          </div>
        ) : (
          <span className="text-xs text-gray-400">중단됨</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-gray-600">{formatDate(submission.created_at)}</TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          {/* 상세보기 버튼 - 항상 표시 */}
          <Link href={`/dashboard/review/kmap/status/${submission.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 font-medium"
            >
              상세보기
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
          
          {['review', 'revision_requested'].includes(submission.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewContent(submission)}
              className="h-7 text-xs text-amber-600 border-amber-300"
            >
              검수
            </Button>
          )}
          {submission.status === 'in_progress' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenMessages(submission)}
              className="h-7 text-xs text-blue-600 border-blue-300"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              문의
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs text-amber-600 border-amber-300"
            onClick={() => {
              if (submission.status === 'completed') {
                window.location.href = `/dashboard/as-request?submission_id=${submission.id}&type=kakaomap`;
              } else if (onAsConditionClick) {
                onAsConditionClick();
              }
            }}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            AS신청
          </Button>
          {canCancelSubmission(submission) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelClick(submission)}
              className="h-7 text-xs text-red-600 border-red-300"
            >
              중단
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

