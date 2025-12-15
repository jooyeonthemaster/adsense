'use client';

import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SubmissionTableRow } from './SubmissionTableRow';
import { SubmissionMobileCard } from './SubmissionMobileCard';
import type { SubmissionWithClient } from './types';

interface ListViewProps {
  submissions: SubmissionWithClient[];
  copiedId: string | null;
  onCopy: (submissionNumber: string) => void;
  onStatusChange: (submission: SubmissionWithClient) => void;
  formatDate: (dateString: string) => string;
}

export function ListView({
  submissions,
  copiedId,
  onCopy,
  onStatusChange,
  formatDate,
}: ListViewProps) {
  return (
    <>
      {/* Desktop Table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>접수번호</TableHead>
              <TableHead>타입</TableHead>
              <TableHead>업체명</TableHead>
              <TableHead>거래처</TableHead>
              <TableHead className="text-center">일 배포</TableHead>
              <TableHead className="text-center">총 수량</TableHead>
              <TableHead>키워드</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-center">진행률</TableHead>
              <TableHead>접수일</TableHead>
              <TableHead className="text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-gray-500">
                  접수 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((sub) => (
                <SubmissionTableRow
                  key={sub.id}
                  submission={sub}
                  copiedId={copiedId}
                  onCopy={onCopy}
                  onStatusChange={onStatusChange}
                  formatDate={formatDate}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {submissions.length === 0 ? (
          <div className="text-center py-8 bg-white border rounded-lg">
            <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <SubmissionMobileCard
              key={sub.id}
              submission={sub}
              onStatusChange={onStatusChange}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </>
  );
}
