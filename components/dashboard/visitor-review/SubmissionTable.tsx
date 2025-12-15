import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ExternalLink,
  Download,
  Image as ImageIcon,
  FileText as FileTextIcon,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ReceiptReviewSubmission, STATUS_CONFIG } from './types';

interface SubmissionTableProps {
  submissions: ReceiptReviewSubmission[];
  downloadingId: string | null;
  onCancelClick: (submission: ReceiptReviewSubmission) => void;
  onDownloadReport: (submission: ReceiptReviewSubmission) => void;
  onAsClick: (submission: ReceiptReviewSubmission) => void;
  formatDate: (dateString: string) => string;
  extractMid: (url: string) => string;
  calculateProgress: (submission: ReceiptReviewSubmission) => number;
  canCancel: (submission: ReceiptReviewSubmission) => boolean;
}

export function SubmissionTable({
  submissions,
  downloadingId,
  onCancelClick,
  onDownloadReport,
  onAsClick,
  formatDate,
  extractMid,
  calculateProgress,
  canCancel,
}: SubmissionTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-semibold">업체명</TableHead>
              <TableHead className="text-xs font-semibold">일 발행수량</TableHead>
              <TableHead className="text-xs font-semibold">총 작업수량</TableHead>
              <TableHead className="text-xs font-semibold">옵션</TableHead>
              <TableHead className="text-xs font-semibold text-center">상태</TableHead>
              <TableHead className="text-xs font-semibold text-center">진행률</TableHead>
              <TableHead className="text-xs font-semibold">접수일시</TableHead>
              <TableHead className="text-xs font-semibold text-right">비용</TableHead>
              <TableHead className="text-xs font-semibold text-center">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-sm text-gray-500">
                접수 내역이 없습니다.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold">업체명</TableHead>
            <TableHead className="text-xs font-semibold">일 발행수량</TableHead>
            <TableHead className="text-xs font-semibold">총 작업수량</TableHead>
            <TableHead className="text-xs font-semibold">옵션</TableHead>
            <TableHead className="text-xs font-semibold text-center">상태</TableHead>
            <TableHead className="text-xs font-semibold text-center">진행률</TableHead>
            <TableHead className="text-xs font-semibold">접수일시</TableHead>
            <TableHead className="text-xs font-semibold text-right">비용</TableHead>
            <TableHead className="text-xs font-semibold text-center">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => {
            const statusDisplay = STATUS_CONFIG[submission.status] || { label: submission.status, variant: 'outline' as const, color: 'gray' };
            const progress = calculateProgress(submission);
            const mid = extractMid(submission.place_url);

            return (
              <TableRow key={submission.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{submission.company_name}</span>
                    <a
                      href={submission.place_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:text-purple-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  {submission.submission_number && (
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">{submission.submission_number}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm">{submission.daily_count}건</TableCell>
                <TableCell className="text-sm font-medium">
                  {submission.total_count}건
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {submission.has_photo && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        사진
                      </Badge>
                    )}
                    {submission.has_script && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        <FileTextIcon className="h-3 w-3 mr-1" />
                        원고
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={statusDisplay.variant} className="text-xs">
                    {statusDisplay.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 rounded-full h-2 transition-all"
                        style={{ width: `${Math.round(progress)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-purple-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatDate(submission.created_at)}
                </TableCell>
                <TableCell className="text-sm font-semibold text-right">
                  {submission.total_points.toLocaleString()}P
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link href={`/dashboard/review/visitor/status/${submission.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50 font-medium"
                      >
                        상세보기
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadReport(submission)}
                      disabled={downloadingId === submission.id}
                      className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
                    >
                      {downloadingId === submission.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      리포트
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                      onClick={() => onAsClick(submission)}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      AS신청
                    </Button>
                    {canCancel(submission) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancelClick(submission)}
                        className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                      >
                        중단
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
