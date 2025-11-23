'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, Image as ImageIcon, FileText, Loader2, ChevronDown, Upload } from 'lucide-react';
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
}

interface ContentItemsListProps {
  submissionId: string;
  items: ContentItem[];
  totalCount: number;
  onItemDeleted: () => void;
}

export function ContentItemsList({
  submissionId,
  items,
  totalCount,
  onItemDeleted,
}: ContentItemsListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleImageClick = (itemId: string) => {
    fileInputRefs.current[itemId]?.click();
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    setUploadingId(itemId);
    try {
      const supabase = createClient();

      // 이미지 업로드 (Supabase Storage)
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

      // Public URL 생성
      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(uploadData.path);

      // 콘텐츠 아이템 업데이트
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/content/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to update');
      }

      toast({
        title: '업로드 완료',
        description: '이미지가 업로드되었습니다.',
      });

      onItemDeleted(); // refresh list
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
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

                  {/* 이미지 */}
                  {item.image_url ? (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={`Content ${item.upload_order}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <>
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
                      <button
                        onClick={() => handleImageClick(item.id)}
                        disabled={uploadingId === item.id}
                        className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uploadingId === item.id ? (
                          <>
                            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                            <span className="text-xs text-muted-foreground">업로드 중...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">클릭하여 이미지 업로드</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

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

                  {/* 메타 정보 */}
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
