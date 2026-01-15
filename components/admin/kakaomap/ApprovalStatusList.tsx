'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileSpreadsheet, CheckCircle, Loader2, Filter, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import type { ContentItem } from './ContentItemsList';

type StatusFilter = 'all' | 'approved' | 'pending' | 'revision_requested';

interface ApprovalStatusListProps {
  submissionId: string;
  contentItems: ContentItem[];
}

export function ApprovalStatusList({ submissionId, contentItems }: ApprovalStatusListProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(false);
  }, [contentItems]);

  // 발행된 아이템만 (is_published === true)
  const publishedItems = useMemo(() =>
    contentItems.filter(item => item.is_published),
    [contentItems]
  );

  // 상태별 카운트
  const counts = useMemo(() => ({
    total: publishedItems.length,
    approved: publishedItems.filter(item => item.review_status === 'approved').length,
    pending: publishedItems.filter(item => item.review_status === 'pending').length,
    revision: publishedItems.filter(item => item.review_status === 'revision_requested').length,
  }), [publishedItems]);

  // 고유 날짜 목록
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    publishedItems.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      dates.add(date);
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [publishedItems]);

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    let result = publishedItems;

    // 상태 필터
    if (statusFilter !== 'all') {
      result = result.filter(item => item.review_status === statusFilter);
    }

    // 날짜 필터
    if (dateFilter !== 'all') {
      result = result.filter(item => {
        const itemDate = new Date(item.created_at).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        return itemDate === dateFilter;
      });
    }

    return result;
  }, [publishedItems, statusFilter, dateFilter]);

  // 승인된 아이템 (엑셀 다운로드용)
  const approvedItems = useMemo(() =>
    publishedItems.filter(item => item.review_status === 'approved'),
    [publishedItems]
  );

  const downloadApprovedAsExcel = useCallback(() => {
    if (approvedItems.length === 0) {
      toast({
        title: '다운로드 실패',
        description: '승인된 원고가 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    const excelData = approvedItems.map((item, index) => ({
      '순번': index + 1,
      '리뷰원고': item.script_text || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '승인된 원고');

    // Set column widths
    ws['!cols'] = [
      { wch: 6 },   // 순번
      { wch: 80 },  // 리뷰원고
    ];

    const fileName = `승인된_원고_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: '다운로드 완료',
      description: `${approvedItems.length}개의 승인된 원고가 다운로드되었습니다.`,
    });
  }, [approvedItems, toast]);

  // 상태별 Badge 렌더링
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-600">승인됨</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">검수대기</Badge>;
      case 'revision_requested':
        return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">수정요청</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              승인 현황
            </CardTitle>
            <CardDescription>
              대행사가 검수한 원고 현황입니다 (발행된 원고 {counts.total}건)
            </CardDescription>
          </div>
          {approvedItems.length > 0 && (
            <Button onClick={downloadApprovedAsExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              승인된 원고 엑셀 다운로드
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 승인 현황 요약 - 클릭하면 필터링 */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
            className={`bg-green-50 border rounded-lg p-4 text-center transition-all ${
              statusFilter === 'approved'
                ? 'border-green-500 ring-2 ring-green-200'
                : 'border-green-200 hover:border-green-400'
            }`}
          >
            <p className="text-2xl font-bold text-green-700">{counts.approved}</p>
            <p className="text-sm text-green-600">승인 완료</p>
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`bg-yellow-50 border rounded-lg p-4 text-center transition-all ${
              statusFilter === 'pending'
                ? 'border-yellow-500 ring-2 ring-yellow-200'
                : 'border-yellow-200 hover:border-yellow-400'
            }`}
          >
            <p className="text-2xl font-bold text-yellow-700">{counts.pending}</p>
            <p className="text-sm text-yellow-600">검수 대기</p>
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'revision_requested' ? 'all' : 'revision_requested')}
            className={`bg-red-50 border rounded-lg p-4 text-center transition-all ${
              statusFilter === 'revision_requested'
                ? 'border-red-500 ring-2 ring-red-200'
                : 'border-red-200 hover:border-red-400'
            }`}
          >
            <p className="text-2xl font-bold text-red-700">{counts.revision}</p>
            <p className="text-sm text-red-600">수정 요청</p>
          </button>
        </div>

        {/* 필터 영역 */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            필터
          </div>

          {/* 상태 필터 */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 ({counts.total})</SelectItem>
              <SelectItem value="approved">승인완료 ({counts.approved})</SelectItem>
              <SelectItem value="pending">검수대기 ({counts.pending})</SelectItem>
              <SelectItem value="revision_requested">수정요청 ({counts.revision})</SelectItem>
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

          {/* 결과 카운트 */}
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredItems.length}건
          </div>
        </div>

        {/* 원고 목록 */}
        {filteredItems.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">순번</TableHead>
                    <TableHead>리뷰원고</TableHead>
                    <TableHead className="w-24 text-center">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2" title={item.script_text || ''}>
                          {item.script_text || '-'}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(item.review_status || 'pending')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>해당 조건의 원고가 없습니다.</p>
            <p className="text-xs mt-1">필터 조건을 변경해보세요.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
