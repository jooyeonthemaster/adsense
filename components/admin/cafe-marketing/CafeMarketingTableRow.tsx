import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Calendar, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SubmissionWithClient, statusConfig, scriptStatusLabels, STATUS_OPTIONS } from '@/types/admin/cafe-marketing';

interface CafeMarketingTableRowProps {
  submission: SubmissionWithClient;
  updatingStatusId: string | null;
  onStatusSelect: (submission: SubmissionWithClient, status: SubmissionWithClient['status']) => void;
  onScriptChange: (submission: SubmissionWithClient) => void;
  onDailyRecordOpen: (submission: SubmissionWithClient) => void;
}

export function CafeMarketingTableRow({
  submission,
  updatingStatusId,
  onStatusSelect,
  onScriptChange,
  onDailyRecordOpen,
}: CafeMarketingTableRowProps) {
  const statusInfo = statusConfig[submission.status];
  const scriptLabel = scriptStatusLabels[submission.script_status || ''] || '원고 상태 미입력';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">{submission.company_name}</TableCell>
      <TableCell className="text-sm text-gray-600">
        {submission.clients?.company_name || '-'}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {submission.region}
        </Badge>
      </TableCell>
      <TableCell className="text-center">{submission.cafe_details?.length || 0}개</TableCell>
      <TableCell className="text-center font-medium">{submission.total_count}건</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={updatingStatusId === submission.id}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-70',
                statusInfo?.color || 'bg-gray-100 text-gray-800'
              )}
            >
              {statusInfo?.label || submission.status}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-36">
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={cn(
                  'text-xs',
                  option.value === submission.status && 'bg-sky-50 text-sky-600'
                )}
                onSelect={() => onStatusSelect(submission, option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${submission.progress_percentage || 0}%` }}
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
            onClick={() => window.location.href = `/admin/cafe-marketing/${submission.id}`}
            className="text-xs text-blue-600 border-blue-300"
          >
            상세
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onScriptChange(submission)}
            className="text-xs"
            title={`원고 상태: ${scriptLabel}`}
          >
            원고
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDailyRecordOpen(submission)}
            className="text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            기록
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}




