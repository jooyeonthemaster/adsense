'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { ExternalLink, ImageIcon, FileText, ChevronRight, AlertTriangle, Download, Loader2 } from 'lucide-react';
import { KAKAOMAP_STATUS_LABELS } from '@/config/kakaomap-status';
import { KakaomapSubmission } from '@/types/review/kmap-status';
import { calculateProgress, formatDate, canCancelSubmission } from '@/utils/review/kmap-status-helpers';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

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
  // onOpenMessages, // 문의 버튼 숨김 처리로 사용하지 않음
  onCancelClick,
  onAsConditionClick,
}: StatusTableRowProps) {
  const { toast } = useToast();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const statusDisplay = KAKAOMAP_STATUS_LABELS[submission.status as keyof typeof KAKAOMAP_STATUS_LABELS] || {
    label: submission.status,
    variant: 'outline' as const
  };
  const progress = calculateProgress(submission);

  // 리포트 다운로드 함수 (업로드 템플릿과 동일한 형식)
  const handleReportDownload = async () => {
    setDownloadLoading(true);
    try {
      const response = await fetch(`/api/submissions/kakaomap/${submission.id}/content`);
      if (!response.ok) throw new Error('데이터를 가져오는데 실패했습니다.');

      const data = await response.json();
      const contentItems = data.items || [];

      if (contentItems.length === 0) {
        toast({
          title: '알림',
          description: '다운로드할 데이터가 없습니다.',
        });
        return;
      }

      // 업로드 템플릿과 동일한 형식으로 변환
      const excelData = contentItems.map((item: {
        script_text: string | null;
        review_registered_date: string | null;
        receipt_date: string | null;
        status: string;
        review_link: string | null;
        review_id: string | null;
      }) => ({
        '접수번호': submission.submission_number || '',
        '업체명': submission.company_name || '',
        '리뷰원고': item.script_text || '',
        '리뷰등록날짜': item.review_registered_date || '',
        '영수증날짜': item.receipt_date || '',
        '상태': item.status === 'approved' ? '승인됨' : item.status === 'rejected' ? '수정요청' : '대기',
        '리뷰링크': item.review_link || '',
        '리뷰아이디': item.review_id || '',
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      // 시트명을 업로드 템플릿과 동일하게 'K맵리뷰'로 설정
      XLSX.utils.book_append_sheet(wb, ws, 'K맵리뷰');

      ws['!cols'] = [
        { wch: 18 }, // 접수번호
        { wch: 20 }, // 업체명
        { wch: 60 }, // 리뷰원고
        { wch: 14 }, // 리뷰등록날짜
        { wch: 14 }, // 영수증날짜
        { wch: 10 }, // 상태
        { wch: 45 }, // 리뷰링크
        { wch: 18 }, // 리뷰아이디
      ];

      XLSX.writeFile(wb, `K맵리뷰_${submission.company_name}_${new Date().toISOString().slice(0, 10)}.xlsx`);

      toast({
        title: '다운로드 완료',
        description: '리포트가 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('Report download error:', error);
      toast({
        variant: 'destructive',
        title: '다운로드 실패',
        description: error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다.',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

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
          <span className="font-medium text-amber-600">{submission.completed_count || 0}</span>
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

          {/* 리포트 다운로드 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReportDownload}
            disabled={downloadLoading}
            className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
          >
            {downloadLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            리포트
          </Button>

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

