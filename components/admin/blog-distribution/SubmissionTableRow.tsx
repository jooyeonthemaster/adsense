'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Copy, Check } from 'lucide-react';
import { TYPE_CONFIG, STATUS_CONFIG } from './constants';
import type { SubmissionWithClient } from './types';

interface SubmissionTableRowProps {
  submission: SubmissionWithClient;
  copiedId: string | null;
  onCopy: (submissionNumber: string) => void;
  onStatusChange: (submission: SubmissionWithClient) => void;
  formatDate: (dateString: string) => string;
  showClient?: boolean;
}

export function SubmissionTableRow({
  submission,
  copiedId,
  onCopy,
  onStatusChange,
  formatDate,
  showClient = true,
}: SubmissionTableRowProps) {
  const typeInfo = TYPE_CONFIG[submission.distribution_type];
  const TypeIcon = typeInfo.icon;
  const statusInfo = STATUS_CONFIG[submission.status];

  const handleRowClick = () => {
    window.location.href = `/admin/blog-distribution/${submission.id}`;
  };

  return (
    <TableRow className="cursor-pointer hover:bg-gray-50" onClick={handleRowClick}>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {submission.submission_number ? (
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs">{submission.submission_number}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onCopy(submission.submission_number!)}
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
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
            <TypeIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium">{typeInfo.label}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium">{submission.company_name}</TableCell>
      {showClient && (
        <TableCell className="text-sm text-gray-600">
          {submission.clients?.company_name || '-'}
        </TableCell>
      )}
      <TableCell className="text-center">{submission.daily_count}건</TableCell>
      <TableCell className="text-center font-medium">{submission.total_count}건</TableCell>
      <TableCell>
        <div className="flex gap-1 flex-wrap max-w-xs">
          {submission.keywords?.slice(0, 2).map((kw, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {kw}
            </Badge>
          ))}
          {(submission.keywords?.length || 0) > 2 && (
            <span className="text-xs text-gray-500">+{(submission.keywords?.length || 0) - 2}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(submission.progress_percentage || 0, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium text-blue-600 min-w-[40px]">
            {submission.progress_percentage || 0}%
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">{formatDate(submission.created_at)}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = `/admin/blog-distribution/${submission.id}`)}
            className="text-xs text-blue-600 border-blue-300"
          >
            상세
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange(submission)}
            className="text-xs"
          >
            상태 변경
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
