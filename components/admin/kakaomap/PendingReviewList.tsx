'use client';

import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Calendar, Filter, Edit2, Upload, Loader2, CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GeneralFeedbackView } from './GeneralFeedbackView';
import type { ContentItem } from './ContentItemsList';

interface PendingReviewListProps {
  submissionId: string;
  contentItems: ContentItem[];
  onUpdate?: () => void;
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
    return new Date(b).getTime() - new Date(a).getTime();
  });
}

export function PendingReviewList({ submissionId, contentItems, onUpdate }: PendingReviewListProps) {
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState<string>('all');

  // 개별 원고 수정 상태
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  // 엑셀 일괄 수정 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 재검수 요청 상태
  const [requestingReReview, setRequestingReReview] = useState(false);

  // 검수 대기 중인 원고만 필터링 (is_published = true AND review_status === 'pending')
  // is_published = true: 관리자가 검수 요청한 원고
  // review_status = 'pending': 대행사가 아직 승인/수정요청 안한 원고
  const pendingItems = useMemo(() => {
    return contentItems.filter(item => item.is_published && item.review_status === 'pending');
  }, [contentItems]);

  // 고유 날짜 목록
  const uniqueDates = useMemo(() => getUniqueDates(pendingItems), [pendingItems]);

  // 날짜별 필터링
  const filteredItems = useMemo(() => {
    if (dateFilter === 'all') return pendingItems;

    return pendingItems.filter((item) => {
      const itemDate = new Date(item.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return itemDate === dateFilter;
    });
  }, [pendingItems, dateFilter]);

  // 통계
  const approvedCount = contentItems.filter(item => item.review_status === 'approved').length;

  // 개별 원고 수정 핸들러
  const handleEditClick = (item: ContentItem) => {
    setEditingItem(item);
    setEditText(item.script_text || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('script_text', editText);

      const response = await fetch(`/api/admin/kakaomap/${submissionId}/content/${editingItem.id}`, {
        method: 'PATCH',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '원고 수정에 실패했습니다.');
      }

      toast({
        title: '수정 완료',
        description: '원고가 수정되었습니다.',
      });

      setEditingItem(null);
      setEditText('');
      onUpdate?.();
    } catch (error) {
      console.error('Edit error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '원고 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // 엑셀 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext || '')) {
      toast({
        title: '오류',
        description: '엑셀 파일만 업로드 가능합니다. (.xlsx, .xls)',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  // 엑셀 일괄 수정 핸들러
  const handleExcelUpdate = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/admin/kakaomap/${submissionId}/excel-bulk-update`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '일괄 수정에 실패했습니다.');
      }

      const successMsg = result.success_count > 0
        ? `${result.success_count}개 수정${result.fail_count > 0 ? `, ${result.fail_count}개 실패` : ''}`
        : '수정 완료';

      toast({
        title: '일괄 수정 완료',
        description: successMsg,
      });

      if (result.fail_count > 0) {
        console.error('Failed items:', result.failed_items);
      }

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUpdate?.();
    } catch (error) {
      console.error('Excel update error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '일괄 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // 재검수 요청 핸들러
  const handleReReviewRequest = async () => {
    if (pendingItems.length === 0) return;

    setRequestingReReview(true);
    try {
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/re-review-request`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '재검수 요청에 실패했습니다.');
      }

      toast({
        title: '재검수 요청 완료',
        description: `${pendingItems.length}개의 원고에 대해 재검수를 요청했습니다.`,
      });

      onUpdate?.();
    } catch (error) {
      console.error('Re-review request error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '재검수 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setRequestingReReview(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 피드백 섹션 */}
      <GeneralFeedbackView submissionId={submissionId} />

      {/* 검수 대기 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle>검수 대기 원고</CardTitle>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {pendingItems.length}개 대기중
            </Badge>
          </div>
          <CardDescription>
            대행사가 검토해야 할 원고 목록입니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{pendingItems.length}</p>
              <p className="text-xs text-amber-600">검수 대기</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
              <p className="text-xs text-green-600">승인 완료</p>
            </div>
          </div>

          {/* 엑셀 일괄 수정 */}
          {pendingItems.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-700">엑셀로 원고 일괄 수정</span>
              </div>
              <div className="space-y-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="bg-white"
                />
                <div className="text-xs text-blue-600 space-y-0.5">
                  <p><CheckCircle2 className="h-3 w-3 inline mr-1" />엑셀 B열에 수정할 원고를 입력하세요</p>
                  <p><AlertCircle className="h-3 w-3 inline mr-1" />엑셀 순서대로 검수 대기 원고가 수정됩니다</p>
                </div>
              </div>
              {selectedFile && !uploading && (
                <div className="p-2 rounded bg-white border border-blue-200 text-sm">
                  선택: {selectedFile.name}
                </div>
              )}
              <Button
                onClick={handleExcelUpdate}
                disabled={!selectedFile || uploading}
                className="w-full"
                variant="outline"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    수정 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    원고 일괄 수정 ({pendingItems.length}개)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 재검수 요청 버튼 */}
          {pendingItems.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">대행사에 재검수 요청</span>
              </div>
              <p className="text-xs text-green-600">
                원고 수정이 완료되면 아래 버튼을 눌러 대행사에 재검수를 요청하세요.
              </p>
              <Button
                onClick={handleReReviewRequest}
                disabled={requestingReReview}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {requestingReReview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    요청 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    재검수 요청 ({pendingItems.length}개 원고)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 필터 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              필터
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <SelectValue placeholder="날짜 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 날짜 ({pendingItems.length})</SelectItem>
                {uniqueDates.map((date) => {
                  const count = pendingItems.filter(item => {
                    const itemDate = new Date(item.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                    return itemDate === date;
                  }).length;
                  return (
                    <SelectItem key={date} value={date}>
                      {date} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div className="ml-auto text-sm text-muted-foreground">
              {filteredItems.length}건
            </div>
          </div>

          {/* 테이블 */}
          {filteredItems.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16 text-center">순번</TableHead>
                      <TableHead className="w-28">등록일</TableHead>
                      <TableHead>리뷰 원고</TableHead>
                      <TableHead className="w-28 text-center">상태</TableHead>
                      <TableHead className="w-16 text-center">수정</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center text-muted-foreground">
                          {item.upload_order || index + 1}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-clamp-2" title={item.script_text || ''}>
                            {item.script_text || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            대기중
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>검수 대기 중인 원고가 없습니다.</p>
              <p className="text-xs mt-1">모든 원고가 검수 완료되었습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 개별 원고 수정 다이얼로그 */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>원고 수정</DialogTitle>
            <DialogDescription>
              검수 대기 중인 원고를 수정합니다. (순번: {editingItem?.upload_order})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">리뷰 원고</label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="리뷰 원고를 입력하세요"
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {editText.length}자
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingItem(null)}
              disabled={saving}
            >
              취소
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editText.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
