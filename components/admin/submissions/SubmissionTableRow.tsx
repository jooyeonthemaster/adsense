import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Eye } from 'lucide-react';
import { UnifiedSubmission, STATUS_LABELS, STATUS_VARIANTS, TYPE_LABELS } from '@/types/admin/submissions';
import { formatDate, getSubmissionDetails } from '@/utils/admin/submission-helpers';

interface SubmissionTableRowProps {
  submission: UnifiedSubmission;
  onOpenDetail: (id: string, type: UnifiedSubmission['type']) => void;
}

export function SubmissionTableRow({
  submission,
  onOpenDetail,
}: SubmissionTableRowProps) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-sm">
        {formatDate(submission.created_at)}
      </TableCell>
      <TableCell className="font-medium">
        {submission.clients?.company_name || '-'}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Badge variant="outline">
          {TYPE_LABELS[submission.type] || submission.type}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {submission.company_name || '-'}
      </TableCell>
      <TableCell className="text-sm">
        {getSubmissionDetails(submission)}
      </TableCell>
      <TableCell>
        {submission.progress_percentage !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="h-2 w-full max-w-[60px] overflow-hidden rounded-full bg-secondary">
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
      <TableCell className="text-right font-semibold">
        {submission.total_points.toLocaleString()} P
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANTS[submission.status] || 'outline'}>
          {STATUS_LABELS[submission.status] || submission.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenDetail(submission.id, submission.type)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}






