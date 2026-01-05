'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { MessageSquare, ChevronRight, AlertTriangle, Download } from 'lucide-react';
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
    variant: 'outline' as const,
  };
  const progress = calculateProgress(submission);

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/submissions/kakaomap/${submission.id}/content`);
      if (!response.ok) throw new Error('Failed to fetch content');

      const data = await response.json();
      const contents = data.contents || [];

      if (contents.length === 0) {
        alert('다운로드할 콘텐츠가 없습니다.');
        return;
      }

      // CSV 생성
      const headers = ['번호', '리뷰 URL', '블로그 URL', '등록일'];
      const rows = contents.map((item: any, index: number) => [
        index + 1,
        item.review_url || '',
        item.blog_url || '',
        item.review_registered_date || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // BOM 추가 (한글 인코딩)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${submission.company_name}_리포트_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('리포트 다운로드에 실패했습니다.');
    }
  };

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="text-xs font-medium">{submission.company_name}</TableCell>
      <TableCell className="text-xs">
        {submission.completed_count || 0} / {submission.total_count}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {submission.has_photo && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
              사진
            </Badge>
          )}
          {submission.script_confirmed && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
              원고
            </Badge>
          )}
          {!submission.has_photo && !submission.script_confirmed && (
            <span className="text-xs text-gray-400">-</span>
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
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  submission.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600">{progress.toFixed(0)}%</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-gray-600">{formatDate(submission.created_at)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Link href={`/dashboard/review/kmap/status/${submission.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2 text-blue-600 border-blue-300">
              상세
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </Link>

          {['review', 'revision_requested'].includes(submission.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewContent(submission)}
              className="h-7 text-xs px-2 text-amber-600 border-amber-300"
            >
              검수
            </Button>
          )}

          {submission.status === 'in_progress' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenMessages(submission)}
              className="h-7 text-xs px-2 text-blue-600 border-blue-300"
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            className="h-7 text-xs px-2 text-green-600 border-green-300"
            title="리포트 다운로드"
          >
            <Download className="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 text-amber-600 border-amber-300"
            onClick={() => {
              if (submission.status === 'completed') {
                window.location.href = `/dashboard/as-request?submission_id=${submission.id}&type=kakaomap`;
              } else if (onAsConditionClick) {
                onAsConditionClick();
              }
            }}
          >
            <AlertTriangle className="h-3 w-3" />
          </Button>

          {canCancelSubmission(submission) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelClick(submission)}
              className="h-7 text-xs px-2 text-red-600 border-red-300"
            >
              중단
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}