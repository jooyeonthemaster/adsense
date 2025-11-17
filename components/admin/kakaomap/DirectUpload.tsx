'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';

interface DirectUploadProps {
  submissionId: string;
  currentCount: number;
  totalCount: number;
  hasPhoto: boolean;
  photoRatio: number;
  onUploadComplete: () => void;
}

export function DirectUpload({
  submissionId,
  currentCount,
  totalCount,
  hasPhoto,
  photoRatio,
  onUploadComplete,
}: DirectUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [script, setScript] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      toast({
        title: '오류',
        description: '이미지 파일만 업로드 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: '오류',
        description: '파일 크기는 10MB 이하여야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    // 검증
    if (!imageFile && !script.trim()) {
      toast({
        title: '오류',
        description: '이미지 또는 원고 중 하나는 필수입니다.',
        variant: 'destructive',
      });
      return;
    }

    if (currentCount >= totalCount) {
      toast({
        title: '오류',
        description: `최대 ${totalCount}개까지만 업로드 가능합니다.`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      let imageUrl: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      // 이미지 업로드 (Supabase Storage)
      if (imageFile) {
        const supabase = createClient();
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `kakaomap/${submissionId}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(filePath, imageFile, {
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

        imageUrl = urlData.publicUrl;
        fileName = imageFile.name;
        fileSize = imageFile.size;
      }

      // 콘텐츠 아이템 생성
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          script_text: script.trim() || null,
          file_name: fileName,
          file_size: fileSize,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '업로드에 실패했습니다.');
      }

      const result = await response.json();

      toast({
        title: '업로드 완료',
        description: `${result.uploaded_count} / ${result.total_count}개 업로드됨`,
      });

      // 폼 초기화
      setImageFile(null);
      setImagePreview(null);
      setScript('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const canUpload = currentCount < totalCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>개별 업로드</CardTitle>
        <CardDescription>
          이미지와 원고를 직접 입력하여 업로드합니다.
          {hasPhoto && (
            <span className="ml-2 text-blue-600 font-medium">
              (사진 포함: {photoRatio}%의 리뷰에 사진 필요)
            </span>
          )}
          {!canUpload && (
            <span className="text-destructive ml-2">
              (최대 개수 도달: {currentCount}/{totalCount})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 이미지 업로드 */}
        <div className="space-y-2">
          <Label>이미지 (선택)</Label>
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-w-md h-48 object-contain rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={!canUpload || uploading}
              />
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            JPG, PNG, GIF, WEBP (최대 10MB)
          </p>
        </div>

        {/* 원고 입력 */}
        <div className="space-y-2">
          <Label>리뷰 원고 (선택)</Label>
          <Textarea
            placeholder="리뷰 원고를 입력하세요..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            disabled={!canUpload || uploading}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {script.length}자
          </p>
        </div>

        {/* 업로드 버튼 */}
        <Button
          onClick={handleUpload}
          disabled={!canUpload || uploading || (!imageFile && !script.trim())}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              업로드
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
