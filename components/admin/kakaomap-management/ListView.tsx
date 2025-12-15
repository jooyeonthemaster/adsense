import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SubmissionRow } from './SubmissionRow';
import type { KakaomapSubmission } from './types';

interface ListViewProps {
  submissions: KakaomapSubmission[];
  copiedId: string | null;
  searchQuery: string;
  statusFilter: string;
  contentFilter: string;
  onCopy: (submissionNumber: string) => void;
  getProgressPercentage: (sub: KakaomapSubmission) => number;
  getProgressBarWidth: (sub: KakaomapSubmission) => number;
}

export function ListView({
  submissions,
  copiedId,
  searchQuery,
  statusFilter,
  contentFilter,
  onCopy,
  getProgressPercentage,
  getProgressBarWidth,
}: ListViewProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>접수번호</TableHead>
            <TableHead>거래처</TableHead>
            <TableHead>상품명</TableHead>
            <TableHead className="text-center">상태</TableHead>
            <TableHead className="text-center">콘텐츠 진행</TableHead>
            <TableHead className="text-center">수량</TableHead>
            <TableHead className="text-center">옵션</TableHead>
            <TableHead className="text-right">비용</TableHead>
            <TableHead className="text-center">알림</TableHead>
            <TableHead className="text-center">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || contentFilter !== 'all'
                  ? '검색 결과가 없습니다.'
                  : '카카오맵 접수 내역이 없습니다.'}
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((sub) => (
              <SubmissionRow
                key={sub.id}
                submission={sub}
                copiedId={copiedId}
                showClient={true}
                onCopy={onCopy}
                getProgressPercentage={getProgressPercentage}
                getProgressBarWidth={getProgressBarWidth}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
