'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TYPE_CONFIG, STATUS_CONFIG } from './constants';
import type { SubmissionWithClient } from './types';

interface SubmissionMobileCardProps {
  submission: SubmissionWithClient;
  onStatusChange: (submission: SubmissionWithClient) => void;
  formatDate: (dateString: string) => string;
}

export function SubmissionMobileCard({
  submission,
  onStatusChange,
  formatDate,
}: SubmissionMobileCardProps) {
  const typeInfo = TYPE_CONFIG[submission.distribution_type];
  const TypeIcon = typeInfo.icon;
  const statusInfo = STATUS_CONFIG[submission.status];

  return (
    <div className="bg-white border rounded-lg p-2.5 space-y-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
              <TypeIcon className="h-2.5 w-2.5 mr-0.5" />
              {typeInfo.label}
            </Badge>
          </div>
          <p className="font-semibold text-xs truncate">{submission.company_name}</p>
          <p className="text-[10px] text-gray-500 truncate">
            {submission.clients?.company_name || '-'}
          </p>
          {submission.submission_number && (
            <p className="text-[10px] font-mono text-blue-600">{submission.submission_number}</p>
          )}
        </div>
        <Badge className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 ${statusInfo.color}`}>
          {statusInfo.label}
        </Badge>
      </div>

      {submission.keywords && submission.keywords.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {submission.keywords.slice(0, 3).map((kw, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5">
              {kw}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
        <div>
          <p className="text-[10px] text-gray-500 mb-0.5">일 배포/총 수량</p>
          <p className="text-xs font-medium">
            {submission.daily_count}건 / {submission.total_count}건
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-0.5">진행률</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(submission.progress_percentage || 0, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-blue-600">
              {submission.progress_percentage || 0}%
            </span>
          </div>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] text-gray-500 mb-0.5">접수일</p>
          <p className="text-xs font-medium">{formatDate(submission.created_at)}</p>
        </div>
      </div>

      <div className="flex gap-1 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = `/admin/blog-distribution/${submission.id}`)}
          className="flex-1 text-[11px] h-7 text-blue-600 border-blue-300 px-2"
        >
          상세
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange(submission)}
          className="flex-1 text-[11px] h-7 px-2"
        >
          상태
        </Button>
      </div>
    </div>
  );
}
