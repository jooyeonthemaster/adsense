'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Image as ImageIcon, Loader2, Upload, Filter, Calendar, Edit2, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';

export interface ContentItem {
  id: string;
  image_url: string | null;
  script_text: string | null;
  file_name: string | null;
  upload_order: number;
  status: string;
  is_published: boolean;
  created_at: string;
  review_registered_date?: string | null;
  receipt_date?: string | null;
  review_link?: string | null;
  review_id?: string | null;
  review_status?: 'pending' | 'approved' | 'revision_requested';
}

interface ContentItemsListProps {
  submissionId: string;
  items: ContentItem[];
  totalCount: number;
  onItemDeleted: () => void;
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

// 검수 상태 설정 (is_published가 true인 경우에만 의미 있음)
const reviewStatusConfig = {
  pending: { label: '검수 대기', className: 'bg-amber-50 text-amber-700 border-amber-200 min-w-[72px] justify-center' },
  approved: { label: '승인됨', className: 'bg-green-50 text-green-700 border-green-200 min-w-[72px] justify-center' },
  revision_requested: { label: '수정 요청', className: 'bg-red-50 text-red-700 border-red-200 min-w-[72px] justify-center' },
};

// 검수 요청 전 상태
const unpublishedStatus = { label: '검수 미요청', className: 'bg-gray-50 text-gray-500 border-gray-200 whitespace-nowrap' };

export function ContentItemsList({
  submissionId,
  items,
  totalCount,
  onItemDeleted,
}: ContentItemsListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // 필터 상태
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 개별 원고 수정 상태
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  // 이미지 미리보기 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 고유 날짜 목록
  const uniqueDates = useMemo(() => getUniqueDates(items), [items]);

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    let result = items;

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

    // 상태 필터
    if (statusFilter !== 'all') {
      if (statusFilter === 'unpublished') {
        result = result.filter((item) => !item.is_published);
      } else {
        result = result.filter((item) => item.is_published && item.review_status === statusFilter);
      }
    }

    return result;
  }, [items, dateFilter, statusFilter]);

  const handleImageClick = (itemId: string) => {
    fileInputRefs.current[itemId]?.click();
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    setUploadingId(itemId);
    try {
      const supabase = createClient();

      const fileExt = file.name.split('.').pop();
      const filePath = `kakaomap/${submissionId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('이미지 업로드에 실패했습니다.');
      }

      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(uploadData.path);

      const response = await fetch(`/api/admin/kakaomap/${submissionId}/content/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast({
        title: '업로드 완료',
        description: '이미지가 업로드되었습니다.',
      });

      onItemDeleted();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('정말 이 콘텐츠를 삭제하시겠습니까?')) return;

    setDeletingId(itemId);
    try {
      const response = await fetch(
        `/api/admin/kakaomap/${submissionId}/content?item_id=${itemId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '삭제에 실패했습니다.');
      }

      toast({
        title: '삭제 완료',
        description: '콘텐츠가 삭제되었습니다.',
      });

      onItemDeleted();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

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
      onItemDeleted();
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

  // 통계 계산 (is_published 기준으로 구분)
  const stats = useMemo(() => {
    const unpublished = items.filter(i => !i.is_published).length;
    const pending = items.filter(i => i.is_published && i.review_status === 'pending').length;
    const approved = items.filter(i => i.is_published && i.review_status === 'approved').length;
    const revision = items.filter(i => i.is_published && i.review_status === 'revision_requested').length;
    return { unpublished, pending, approved, revision };
  }, [items]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle>업로드된 콘텐츠</CardTitle>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {items.length} / {totalCount}개 ({Math.round((items.length / totalCount) * 100)}%)
          </Badge>
        </div>
        <CardDescription>
          업로드된 원고 목록입니다. 필터로 원하는 원고를 찾을 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 진행률 바 */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-blue-500 rounded-full h-2 transition-all"
            style={{ width: `${(items.length / totalCount) * 100}%` }}
          />
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-gray-600">{stats.unpublished}</p>
            <p className="text-xs text-gray-500">검수 미요청</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-xs text-amber-600">검수 대기</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-green-700">{stats.approved}</p>
            <p className="text-xs text-green-600">승인됨</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-red-700">{stats.revision}</p>
            <p className="text-xs text-red-600">수정 요청</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            필터
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              <SelectValue placeholder="날짜 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 날짜 ({items.length})</SelectItem>
              {uniqueDates.map((date) => {
                const count = items.filter(item => {
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-8 text-sm">
              <SelectValue placeholder="검수 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="unpublished">검수 미요청</SelectItem>
              <SelectItem value="pending">검수 대기</SelectItem>
              <SelectItem value="approved">승인됨</SelectItem>
              <SelectItem value="revision_requested">수정 요청</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-muted-foreground">
            {filteredItems.length}건
          </div>
        </div>

        {/* 테이블 */}
        {filteredItems.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-14 text-center">순번</TableHead>
                    <TableHead className="w-16 text-center">이미지</TableHead>
                    <TableHead>리뷰 원고</TableHead>
                    <TableHead className="w-24">등록일</TableHead>
                    <TableHead className="w-28 text-center">검수 상태</TableHead>
                    <TableHead className="w-24 text-center">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium">
                        #{item.upload_order}
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          ref={(el) => { fileInputRefs.current[item.id] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(item.id, file);
                          }}
                        />
                        {item.image_url ? (
                          <button
                            onClick={() => setPreviewImage(item.image_url)}
                            className="w-10 h-10 rounded overflow-hidden border hover:ring-2 ring-blue-500 transition-all"
                          >
                            <img
                              src={item.image_url}
                              alt={`#${item.upload_order}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleImageClick(item.id)}
                            disabled={uploadingId === item.id}
                            className="w-10 h-10 rounded bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                          >
                            {uploadingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2" title={item.script_text || ''}>
                          {item.script_text || <span className="text-muted-foreground italic">원고 없음</span>}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {!item.is_published ? (
                          <Badge variant="outline" className={unpublishedStatus.className}>
                            {unpublishedStatus.label}
                          </Badge>
                        ) : item.review_status && reviewStatusConfig[item.review_status] ? (
                          <Badge variant="outline" className={reviewStatusConfig[item.review_status].className}>
                            {reviewStatusConfig[item.review_status].label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                            미지정
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(item)}
                            className="h-8 w-8 p-0"
                            title="수정"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id || item.review_status === 'approved'}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive disabled:opacity-30"
                            title={item.review_status === 'approved' ? '승인된 콘텐츠는 삭제 불가' : '삭제'}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>조건에 맞는 콘텐츠가 없습니다.</p>
            <p className="text-xs mt-1">필터를 변경하거나 새 콘텐츠를 업로드하세요.</p>
          </div>
        )}
      </CardContent>

      {/* 원고 수정 다이얼로그 */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>원고 수정</DialogTitle>
            <DialogDescription>
              원고를 수정합니다. (순번: #{editingItem?.upload_order})
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

      {/* 이미지 미리보기 다이얼로그 */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>이미지 미리보기</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex items-center justify-center">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
