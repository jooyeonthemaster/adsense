'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExcelUploadProps {
  submissionId: string;
  currentCount: number;
  totalCount: number;
  hasPhoto: boolean;
  photoRatio: number;
  onUploadComplete: () => void;
}

export function ExcelUpload({
  submissionId,
  currentCount,
  totalCount,
  hasPhoto,
  photoRatio,
  onUploadComplete,
}: ExcelUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
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

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      // FormData로 파일 전송
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/admin/kakaomap/${submissionId}/excel-bulk-upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '업로드에 실패했습니다.');
      }

      // 성공 메시지
      const successMsg = result.success_count > 0
        ? `${result.success_count}개 성공${result.fail_count > 0 ? `, ${result.fail_count}개 실패` : ''}`
        : '업로드 완료';

      toast({
        title: '업로드 완료',
        description: successMsg,
      });

      // 실패한 항목이 있으면 추가 알림
      if (result.fail_count > 0 && result.failed_items) {
        console.error('Failed items:', result.failed_items);
        toast({
          title: '일부 실패',
          description: `${result.fail_count}개 항목 업로드에 실패했습니다. 콘솔을 확인하세요.`,
          variant: 'destructive',
        });
      }

      // 초기화
      setSelectedFile(null);
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
        <CardTitle>엑셀 일괄 업로드 (원고만)</CardTitle>
        <CardDescription>
          Excel 파일에서 리뷰 원고를 일괄 업로드합니다. 이미지는 개별 업로드를 사용하세요.
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
        {/* 파일 선택 */}
        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={!canUpload || uploading}
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              <strong>Excel 형식:</strong> B열에 리뷰 원고 입력
            </p>
            <p className="text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              <strong>이미지:</strong> Excel 업로드 후 &quot;개별 업로드&quot;로 이미지 추가
            </p>
            <p className="text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              헤더 행: 1행에 &quot;원고&quot; 또는 &quot;리뷰&quot; 포함 시 자동 감지
            </p>
          </div>
        </div>

        {/* 선택된 파일 */}
        {selectedFile && !uploading && (
          <div className="p-3 rounded-lg border bg-muted/50">
            <p className="text-sm font-medium">선택된 파일:</p>
            <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
          </div>
        )}

        {/* 업로드 버튼 */}
        <Button
          onClick={handleUpload}
          disabled={!canUpload || !selectedFile || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              원고 업로드 중...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              원고 일괄 업로드
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
