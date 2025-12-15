import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Download,
  Image as ImageIcon,
  FileText as FileTextIcon,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { ReceiptReviewSubmission, STATUS_CONFIG } from './types';

interface SubmissionCardProps {
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

export function SubmissionCard({
  submissions,
  downloadingId,
  onCancelClick,
  onDownloadReport,
  onAsClick,
  formatDate,
  extractMid,
  calculateProgress,
  canCancel,
}: SubmissionCardProps) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {submissions.map((submission) => {
        const statusDisplay = STATUS_CONFIG[submission.status];
        const progress = calculateProgress(submission);
        const mid = extractMid(submission.place_url);

        return (
          <div
            key={submission.id}
            className="bg-white border border-gray-200 rounded-lg p-2.5 space-y-2 shadow-sm"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-semibold text-xs truncate">{submission.company_name}</h3>
                  <a
                    href={submission.place_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-500 flex-shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {submission.submission_number && (
                  <p className="text-[10px] text-gray-500 truncate font-mono">{submission.submission_number}</p>
                )}
              </div>
              <Badge variant={statusDisplay.variant} className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                {statusDisplay.label}
              </Badge>
            </div>

            {/* 옵션 */}
            {(submission.has_photo || submission.has_script) && (
              <div className="flex gap-1.5">
                {submission.has_photo && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                    <ImageIcon className="h-2.5 w-2.5 mr-0.5" />
                    사진
                  </Badge>
                )}
                {submission.has_script && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                    <FileTextIcon className="h-2.5 w-2.5 mr-0.5" />
                    원고
                  </Badge>
                )}
              </div>
            )}

            {/* 진행률 */}
            {submission.status === 'in_progress' && progress > 0 && (
              <div>
                <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                  <span>진행률</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 상세 정보 */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">일 발행수량</p>
                <p className="text-xs font-medium">{submission.daily_count}건</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 mb-0.5">총 작업수량</p>
                <p className="text-xs font-medium">{submission.total_count}건</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 mb-0.5">접수일시</p>
                <p className="text-xs font-medium">{formatDate(submission.created_at)}</p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-1.5 pt-1">
              <Link href={`/dashboard/review/visitor/status/${submission.id}`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-[11px] h-7 text-blue-600 border-blue-300 hover:bg-blue-50 font-medium px-2"
                >
                  상세보기
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadReport(submission)}
                disabled={downloadingId === submission.id}
                className="flex-1 text-[11px] h-7 text-green-600 border-green-300 hover:bg-green-50 px-2"
              >
                {downloadingId === submission.id ? (
                  <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                ) : (
                  <Download className="h-2.5 w-2.5 mr-0.5" />
                )}
                리포트
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-[11px] h-7 text-amber-600 border-amber-300 px-2"
                onClick={() => onAsClick(submission)}
              >
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                AS신청
              </Button>
              {canCancel(submission) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancelClick(submission)}
                  className="flex-1 text-[11px] h-7 text-red-600 border-red-300 px-2"
                >
                  중단
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
