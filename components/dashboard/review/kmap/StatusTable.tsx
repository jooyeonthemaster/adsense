import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KakaomapSubmission } from '@/types/review/kmap-status';
import { StatusTableRow } from './StatusTableRow';

interface StatusTableProps {
  submissions: KakaomapSubmission[];
  onViewContent: (submission: KakaomapSubmission) => void;
  onOpenMessages: (submission: KakaomapSubmission) => void;
  onCancelClick: (submission: KakaomapSubmission) => void;
  onAsConditionClick?: () => void;
}

export function StatusTable({
  submissions,
  onViewContent,
  onOpenMessages,
  onCancelClick,
  onAsConditionClick,
}: StatusTableProps) {
  return (
    <div className="hidden md:block bg-white border rounded-lg overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-semibold">업체명</TableHead>
            <TableHead className="text-xs font-semibold">업로드/총 건수</TableHead>
            <TableHead className="text-xs font-semibold">옵션</TableHead>
            <TableHead className="text-xs font-semibold">진행 상태</TableHead>
            <TableHead className="text-xs font-semibold">진행률</TableHead>
            <TableHead className="text-xs font-semibold">접수일</TableHead>
            <TableHead className="text-xs font-semibold text-center">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-sm text-gray-500">
                접수 내역이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((sub) => (
              <StatusTableRow
                key={sub.id}
                submission={sub}
                onViewContent={onViewContent}
                onOpenMessages={onOpenMessages}
                onCancelClick={onCancelClick}
                onAsConditionClick={onAsConditionClick}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}














