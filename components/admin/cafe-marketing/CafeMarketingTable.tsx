import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SubmissionWithClient } from '@/types/admin/cafe-marketing';
import { CafeMarketingTableRow } from './CafeMarketingTableRow';

interface CafeMarketingTableProps {
  submissions: SubmissionWithClient[];
  updatingStatusId: string | null;
  onStatusSelect: (submission: SubmissionWithClient, status: SubmissionWithClient['status']) => void;
  onScriptChange: (submission: SubmissionWithClient) => void;
  onDailyRecordOpen: (submission: SubmissionWithClient) => void;
}

export function CafeMarketingTable({
  submissions,
  updatingStatusId,
  onStatusSelect,
  onScriptChange,
  onDailyRecordOpen,
}: CafeMarketingTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>업체명</TableHead>
              <TableHead>거래처</TableHead>
              <TableHead>지역</TableHead>
              <TableHead className="text-center">카페 수</TableHead>
              <TableHead className="text-center">발행 건수</TableHead>
              <TableHead>진행 상태</TableHead>
              <TableHead className="text-center">진행률</TableHead>
              <TableHead>접수일</TableHead>
              <TableHead className="text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                  접수 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((sub) => (
                <CafeMarketingTableRow
                  key={sub.id}
                  submission={sub}
                  updatingStatusId={updatingStatusId}
                  onStatusSelect={onStatusSelect}
                  onScriptChange={onScriptChange}
                  onDailyRecordOpen={onDailyRecordOpen}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards - Placeholder (테이블 구조가 복잡하여 상세 페이지로 유도) */}
      <div className="md:hidden space-y-2">
        {submissions.length === 0 ? (
          <div className="text-center py-8 bg-white border rounded-lg">
            <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-800 font-medium mb-2">모바일에서는 데스크톱 버전을 이용해주세요</p>
            <p className="text-[10px] text-amber-600">카페 마케팅 관리는 테이블 구조가 복잡하여 데스크톱 환경에서 최적화되어 있습니다.</p>
          </div>
        )}
      </div>
    </>
  );
}

