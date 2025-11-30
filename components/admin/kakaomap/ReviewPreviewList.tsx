'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Edit3,
  MoreVertical,
  Copy,
  Check,
  Filter,
  Save,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GeneratedReview,
  LengthOption,
  ToneTarget,
  LENGTH_OPTIONS,
  TONE_OPTIONS,
} from '@/types/review/ai-generation';

interface ReviewPreviewListProps {
  reviews: GeneratedReview[];
  onUpdateReview: (id: string, updates: Partial<GeneratedReview>) => void;
  onDeleteReview: (id: string) => void;
  onRegenerateReview: (id: string) => Promise<void>;
  onSaveSelected: () => void;
  isSaving?: boolean;
  maxSaveCount?: number;
}

type FilterType = 'all' | LengthOption | ToneTarget | 'with_emoji' | 'without_emoji';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'short', label: '짧은 글' },
  { value: 'medium', label: '중간 글' },
  { value: 'long', label: '긴 글' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50s', label: '50대' },
  { value: 'mz', label: 'MZ세대' },
  { value: 'with_emoji', label: '이모티콘 포함' },
  { value: 'without_emoji', label: '이모티콘 미포함' },
];

export function ReviewPreviewList({
  reviews,
  onUpdateReview,
  onDeleteReview,
  onRegenerateReview,
  onSaveSelected,
  isSaving = false,
  maxSaveCount,
}: ReviewPreviewListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 필터링된 리뷰 목록
  const filteredReviews = useMemo(() => {
    if (filter === 'all') return reviews;

    return reviews.filter((review) => {
      if (['short', 'medium', 'long'].includes(filter)) {
        return review.length_type === filter;
      }
      if (['20s', '30s', '40s', '50s', 'mz'].includes(filter)) {
        return review.tone_type === filter;
      }
      if (filter === 'with_emoji') return review.has_emoji;
      if (filter === 'without_emoji') return !review.has_emoji;
      return true;
    });
  }, [reviews, filter]);

  // 선택된 리뷰 수
  const selectedCount = useMemo(
    () => reviews.filter((r) => r.selected).length,
    [reviews]
  );

  // 전체 선택/해제
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      filteredReviews.forEach((review) => {
        onUpdateReview(review.id, { selected });
      });
    },
    [filteredReviews, onUpdateReview]
  );

  // 개별 선택 토글
  const handleToggleSelect = useCallback(
    (id: string) => {
      const review = reviews.find((r) => r.id === id);
      if (review) {
        onUpdateReview(id, { selected: !review.selected });
      }
    },
    [reviews, onUpdateReview]
  );

  // 펼치기/접기 토글
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 편집 시작
  const handleStartEdit = useCallback((review: GeneratedReview) => {
    setEditingId(review.id);
    setEditText(review.script_text);
  }, []);

  // 편집 저장
  const handleSaveEdit = useCallback(() => {
    if (editingId && editText.trim()) {
      onUpdateReview(editingId, {
        script_text: editText.trim(),
        char_count: editText.trim().length,
      });
    }
    setEditingId(null);
    setEditText('');
  }, [editingId, editText, onUpdateReview]);

  // 편집 취소
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText('');
  }, []);

  // 복사
  const handleCopy = useCallback(async (review: GeneratedReview) => {
    await navigator.clipboard.writeText(review.script_text);
    setCopiedId(review.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // 삭제 확인
  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      onDeleteReview(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDeleteReview]);

  // 재생성
  const handleRegenerate = useCallback(
    async (id: string) => {
      onUpdateReview(id, { isRegenerating: true });
      try {
        await onRegenerateReview(id);
      } finally {
        onUpdateReview(id, { isRegenerating: false });
      }
    },
    [onUpdateReview, onRegenerateReview]
  );

  const allSelected = filteredReviews.length > 0 && filteredReviews.every((r) => r.selected);
  const someSelected = filteredReviews.some((r) => r.selected);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            생성된 리뷰 미리보기
            <Badge variant="secondary" className="ml-2">
              {reviews.length}개 생성됨
            </Badge>
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* 필터 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {FILTER_OPTIONS.find((o) => o.value === filter)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {FILTER_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={cn(filter === option.value && 'bg-accent')}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 일괄 선택 및 저장 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectAll(!allSelected)}
              className="gap-2"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {allSelected ? '전체 해제' : '전체 선택'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedCount}개 선택됨
              {maxSaveCount && selectedCount > maxSaveCount && (
                <span className="text-destructive ml-1">
                  (최대 {maxSaveCount}개까지 저장 가능)
                </span>
              )}
            </span>
          </div>

          <Button
            onClick={onSaveSelected}
            disabled={selectedCount === 0 || isSaving || (maxSaveCount !== undefined && selectedCount > maxSaveCount)}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                선택된 {selectedCount}개 저장
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {filter === 'all'
                  ? '생성된 리뷰가 없습니다.'
                  : '해당 조건의 리뷰가 없습니다.'}
              </div>
            ) : (
              filteredReviews.map((review, index) => {
                const isExpanded = expandedIds.has(review.id);
                const isEditing = editingId === review.id;
                const isLongText = review.script_text.length > 150;

                return (
                  <div
                    key={review.id}
                    className={cn(
                      'border rounded-lg transition-all',
                      review.selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50',
                      review.isRegenerating && 'opacity-50'
                    )}
                  >
                    {/* 헤더 */}
                    <div className="flex items-start gap-3 p-3">
                      <Checkbox
                        checked={review.selected}
                        onCheckedChange={() => handleToggleSelect(review.id)}
                        disabled={review.isRegenerating}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        {/* 메타 정보 */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {LENGTH_OPTIONS[review.length_type]?.label || review.length_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {TONE_OPTIONS[review.tone_type]?.label || review.tone_type}
                          </Badge>
                          <Badge
                            variant={review.has_emoji ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {review.has_emoji ? '😊' : '텍스트'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {review.char_count}자
                          </span>
                        </div>

                        {/* 본문 */}
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={6}
                              className="resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                취소
                              </Button>
                              <Button size="sm" onClick={handleSaveEdit}>
                                저장
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Collapsible
                            open={isExpanded || !isLongText}
                            onOpenChange={() =>
                              isLongText && handleToggleExpand(review.id)
                            }
                          >
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {isLongText && !isExpanded ? (
                                <>
                                  {review.script_text.slice(0, 150)}...
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="px-1 h-auto text-primary"
                                    >
                                      더 보기
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    </Button>
                                  </CollapsibleTrigger>
                                </>
                              ) : (
                                <CollapsibleContent forceMount={!isLongText ? true : undefined}>
                                  {review.script_text}
                                  {isLongText && (
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="px-1 h-auto text-primary"
                                      >
                                        접기
                                        <ChevronUp className="h-3 w-3 ml-1" />
                                      </Button>
                                    </CollapsibleTrigger>
                                  )}
                                </CollapsibleContent>
                              )}
                            </div>
                          </Collapsible>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      {!isEditing && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              disabled={review.isRegenerating}
                            >
                              {review.isRegenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopy(review)}>
                              {copiedId === review.id ? (
                                <>
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                  복사됨
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  복사
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartEdit(review)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRegenerate(review.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              재생성
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(review.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>리뷰를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 삭제된 리뷰는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
