'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GuideImage {
  url: string;
  mobile_url?: string;
  link?: string;
  alt?: string;
}

interface ImageUploaderProps {
  images: GuideImage[];
  onChange: (images: GuideImage[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const newImages: GuideImage[] = [];

      for (const file of Array.from(files)) {
        // 파일명 생성
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `product-guides/${fileName}`;

        // Supabase Storage에 업로드 (submissions 버켓 사용)
        const { data, error } = await supabase.storage
          .from('submissions')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Public URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(filePath);

        newImages.push({
          url: publicUrl,
          alt: '', // 파일명 대신 빈 값으로 (관리자가 직접 입력)
        });
      }

      onChange([...images, ...newImages]);
      
      toast({
        title: '성공',
        description: `${newImages.length}개 이미지가 업로드되었습니다`,
      });
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast({
        title: '오류',
        description: '이미지 업로드에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const updateImageLink = (index: number, link: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], link };
    onChange(updated);
  };

  const updateImageAlt = (index: number, alt: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], alt };
    onChange(updated);
  };

  const handleMobileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `mobile-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-guides/${fileName}`;

      const { data, error } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(filePath);

      const updated = [...images];
      updated[index] = { ...updated[index], mobile_url: publicUrl };
      onChange(updated);

      toast({
        title: '성공',
        description: '모바일 이미지가 업로드되었습니다',
      });
    } catch (error) {
      console.error('모바일 이미지 업로드 오류:', error);
      toast({
        title: '오류',
        description: '모바일 이미지 업로드에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>이미지 추가</Label>
        <div className="mt-2">
          <label
            htmlFor="image-upload"
            className={cn(
              'flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors',
              uploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-primary hover:bg-primary/5'
            )}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading ? '업로드 중...' : '이미지 선택 (복수 선택 가능)'}
            </span>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 이미지 목록 */}
      {images.length > 0 && (
        <div className="space-y-3">
          <Label>업로드된 이미지 ({images.length}개)</Label>
          <div className="space-y-3">
            {images.map((image, index) => (
              <Card key={index} className="p-4">
                <div className="flex gap-4">
                  {/* 이미지 미리보기 */}
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={image.url}
                      alt={image.alt || `이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 이미지 정보 입력 */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs">이미지 설명</Label>
                      <Input
                        value={image.alt || ''}
                        onChange={(e) => updateImageAlt(index, e.target.value)}
                        placeholder="이미지 설명 (선택)"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" />
                        클릭 시 이동할 URL (선택)
                      </Label>
                      <Input
                        value={image.link || ''}
                        onChange={(e) => updateImageLink(index, e.target.value)}
                        placeholder="https://example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">모바일 전용 이미지 (선택)</Label>
                      <div className="mt-1 flex items-center gap-2">
                        {image.mobile_url ? (
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden">
                              <img src={image.mobile_url} alt="모바일" className="w-full h-full object-cover" />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = [...images];
                                updated[index] = { ...updated[index], mobile_url: undefined };
                                onChange(updated);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex-1 cursor-pointer">
                            <div className="border-2 border-dashed rounded p-2 text-center hover:border-primary transition-colors">
                              <ImageIcon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">모바일용 업로드</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleMobileUpload(index, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        모바일에 최적화된 이미지를 따로 업로드할 수 있습니다
                      </p>
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="self-start"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

