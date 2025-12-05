'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, FileText, Loader2, ChevronDown, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ContentItem {
  id: string;
  image_url: string | null;
  script_text: string | null;
  file_name: string | null;
  upload_order: number;
  status: string;
  is_published: boolean;
  created_at: string;
  // 엑셀 업로드 필드
  review_registered_date: string | null;
  receipt_date: string | null;
  review_link: string | null;
  review_id: string | null;
}

interface ContentItemsListProps {
  submissionId: string;
  items: ContentItem[];
  totalCount: number;
  onItemDeleted: () => void;
}

// 날짜별로 아이템 그룹화
function groupItemsByDate(items: ContentItem[]): Record<string, ContentItem[]> {
  const groups: Record<string, ContentItem[]> = {};

  items.forEach((item) => {
    const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
  });

  return groups;
}

export function ContentItemsList({
  submissionId,
  items,
  totalCount,
  onItemDeleted,
}: ContentItemsListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  // 날짜별 그룹화 (최신 날짜 먼저)
  const groupedItems = useMemo(() => {
    const groups = groupItemsByDate(items);
    // 날짜 기준 내림차순 정렬
    const sortedDates = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(groups[a][0].created_at);
      const dateB = new Date(groups[b][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });
    return sortedDates.map((date) => ({ date, items: groups[date] }));
  }, [items]);

  const handleDelete = async (itemId: string) => {
    if (!confirm('정말 이 콘텐츠를 삭제하시겠습니까?')) return;

    setDeletingId(itemId);
    try {
      const response = await fetch(
        `/api/admin/kakaomap/${submissionId}/content?item_id=${itemId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete');

      toast({
        title: '삭제 완료',
        description: '콘텐츠가 삭제되었습니다.',
      });

      onItemDeleted();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: '오류',
        description: '삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-0 hover:bg-transparent">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">업로드된 콘텐츠</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              </div>
            </Button>
          </CollapsibleTrigger>
          <p className="text-sm text-muted-foreground">
            {items.length} / {totalCount}개 업로드됨 ({Math.round((items.length / totalCount) * 100)}%)
          </p>
        </div>
        <div className="w-full max-w-xs bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${(items.length / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <CollapsibleContent>
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              아직 업로드된 콘텐츠가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedItems.map(({ date, items: dateItems }) => (
              <Collapsible key={date} defaultOpen={false}>
                {/* 날짜 헤더 (클릭하여 접기/펼치기) */}
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:-rotate-90" />
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{date}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {dateItems.length}개
                    </Badge>
                  </button>
                </CollapsibleTrigger>

                {/* 해당 날짜의 콘텐츠 그리드 */}
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dateItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* 순번 */}
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">#{item.upload_order}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>

                            {/* 원고 */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">리뷰 원고</span>
                              </div>
                              {item.script_text ? (
                                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                                  {item.script_text}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">원고 없음</p>
                              )}
                            </div>

                            {/* 시간 정보 */}
                            <div className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
