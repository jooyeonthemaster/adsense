'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Filter, CheckCheck, Loader2 } from 'lucide-react';
import { ContentItem, ContentFilter, Feedback } from '@/types/review/kmap-content';
import { getReviewStatusInfo } from '@/utils/review/kmap-helpers';
import { GeneralFeedbackSection } from './GeneralFeedbackSection';

interface ContentGridProps {
  items: ContentItem[];
  feedbacks: Feedback[];
  onSendFeedback: (message: string) => Promise<void>;
  onBulkApprove?: () => void;
  isProcessing?: boolean;
}

// 날짜 포맷팅
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

// 고유 날짜 목록 추출
function getUniqueDates(items: ContentItem[]): string[] {
  const dates = new Set<string>();
  items.forEach((item) => {
    const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    dates.add(date);
  });
  return Array.from(dates).sort((a, b) => {
    // 최신 날짜 먼저
    return new Date(b).getTime() - new Date(a).getTime();
  });
}

export function ContentGrid({ items, feedbacks, onSendFeedback, onBulkApprove, isProcessing }: ContentGridProps) {
  const [statusFilter, setStatusFilter] = useState<ContentFilter>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // 고유 날짜 목록
  const uniqueDates = useMemo(() => getUniqueDates(items), [items]);

  // 상태별 카운트
  const counts = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.review_status === 'pending').length,
    approved: items.filter((i) => i.review_status === 'approved').length,
  }), [items]);

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    let result = items;

    // 상태 필터
    if (statusFilter !== 'all') {
      if (statusFilter === 'revised') {
        result = result.filter((i) => i.review_status === 'approved' && i.has_been_revised);
      } else {
        result = result.filter((i) => i.review_status === statusFilter);
      }
    }

    // 날짜 필터
    if (dateFilter !== 'all') {
      result = result.filter((item) => {
        const itemDate = new Date(item.created_at).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        return itemDate === dateFilter;
      });
    }

    return result;
  }, [items, statusFilter, dateFilter]);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center text-gray-500 shadow-sm">
        해당 상태의 콘텐츠가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* 피드백 섹션 */}
      <div className="p-4 border-b">
        <GeneralFeedbackSection
          feedbacks={feedbacks}
          onSendFeedback={onSendFeedback}
          pendingCount={counts.pending}
        />
      </div>

      {/* 필터 영역 */}
      <div className="p-4 border-b bg-gray-50 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          필터
        </div>

        {/* 상태 필터 */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContentFilter)}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 ({counts.total})</SelectItem>
            <SelectItem value="pending">검수대기 ({counts.pending})</SelectItem>
            <SelectItem value="approved">승인완료 ({counts.approved})</SelectItem>
          </SelectContent>
        </Select>

        {/* 날짜 필터 */}
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            <SelectValue placeholder="날짜 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 날짜</SelectItem>
            {uniqueDates.map((date) => (
              <SelectItem key={date} value={date}>
                {date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 필터 초기화 */}
        {(statusFilter !== 'all' || dateFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setStatusFilter('all');
              setDateFilter('all');
            }}
          >
            초기화
          </Button>
        )}

        {/* 미승인 건수 */}
        <div className="ml-auto text-sm text-muted-foreground">
          미승인 {counts.pending}건
        </div>

        {/* 일괄 승인 버튼 */}
        {onBulkApprove && counts.pending > 0 && (
          <Button
            size="sm"
            className="h-8 bg-green-600 hover:bg-green-700 text-white"
            onClick={onBulkApprove}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-1" />
            )}
            일괄 승인
          </Button>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16 text-center">순번</TableHead>
              <TableHead className="w-24">날짜</TableHead>
              <TableHead>리뷰 원고</TableHead>
              <TableHead className="w-32 text-center">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  필터 조건에 맞는 콘텐츠가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const statusInfo = getReviewStatusInfo(item);
                return (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {item.upload_order}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell>
                      {item.script_text ? (
                        <p className="text-sm line-clamp-2 whitespace-pre-wrap">
                          {item.script_text}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">원고 없음</p>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {'className' in statusInfo ? (
                        <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                      ) : (
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
