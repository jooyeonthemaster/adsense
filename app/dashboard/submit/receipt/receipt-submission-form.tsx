'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ReceiptSubmissionFormProps {
  clientId: string;
  pricePerUnit: number;
  currentPoints: number;
}

export function ReceiptSubmissionForm({
  clientId,
  pricePerUnit,
  currentPoints,
}: ReceiptSubmissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [naverPlaceUrl, setNaverPlaceUrl] = useState('');
  const [totalCount, setTotalCount] = useState(30);
  const [totalPoints, setTotalPoints] = useState(0);
  const [notes, setNotes] = useState('');

  // File upload state
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  // Calculate total points when count changes
  useEffect(() => {
    const calculated = pricePerUnit * totalCount;
    setTotalPoints(calculated);
  }, [pricePerUnit, totalCount]);

  const handleBusinessLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      setBusinessLicenseFile(file);
      setError('');
    }
  };

  const handlePhotoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file sizes
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('각 파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setPhotoFiles(files);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!companyName || !naverPlaceUrl || !totalCount) {
        setError('필수 항목을 모두 입력해주세요.');
        setLoading(false);
        return;
      }

      if (totalCount < 30) {
        setError('최소 30타 이상 입력해주세요.');
        setLoading(false);
        return;
      }

      if (totalPoints > currentPoints) {
        setError('포인트가 부족합니다.');
        setLoading(false);
        return;
      }

      // Upload business license if provided
      let businessLicenseUrl = null;
      if (businessLicenseFile) {
        const formData = new FormData();
        formData.append('file', businessLicenseFile);
        formData.append('folder', `receipts/${clientId}/license`);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('사업자등록증 업로드에 실패했습니다.');
        }

        const uploadData = await uploadRes.json();
        businessLicenseUrl = uploadData.url;
      }

      // Upload photo files if provided
      const photoUrls: string[] = [];
      for (const file of photoFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', `receipts/${clientId}/photos`);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('사진 업로드에 실패했습니다.');
        }

        const uploadData = await uploadRes.json();
        photoUrls.push(uploadData.url);
      }

      // Submit the form
      const response = await fetch('/api/submissions/receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName,
          place_url: naverPlaceUrl,
          total_count: totalCount,
          total_points: totalPoints,
          business_license_url: businessLicenseUrl,
          photo_urls: photoUrls,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '접수에 실패했습니다.');
        return;
      }

      // Success
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '접수 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = companyName && naverPlaceUrl && totalCount >= 30;
  const hasEnoughPoints = totalPoints <= currentPoints;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">접수 정보</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            영수증 리뷰 서비스 정보를 입력해주세요 (최소 30타)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="company_name" className="text-xs sm:text-sm">
              업체명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="업체명을 입력하세요"
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="naver_place_url" className="text-xs sm:text-sm">
              네이버 플레이스 URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="naver_place_url"
              type="url"
              value={naverPlaceUrl}
              onChange={(e) => setNaverPlaceUrl(e.target.value)}
              placeholder="https://..."
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="total_count" className="text-xs sm:text-sm">
              총 타수 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="total_count"
              type="number"
              min="30"
              value={totalCount}
              onChange={(e) => setTotalCount(parseInt(e.target.value) || 30)}
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">최소 30타 이상</p>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">참고사항</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 요청사항이 있으면 입력하세요"
              disabled={loading}
              className="text-xs sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">파일 업로드</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            사업자등록증 또는 샘플 영수증, 사진을 업로드해주세요 (선택사항)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="business_license" className="text-xs sm:text-sm">
              사업자등록증 또는 샘플 영수증
            </Label>
            <Input
              id="business_license"
              type="file"
              accept="image/*,.pdf"
              onChange={handleBusinessLicenseChange}
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
            {businessLicenseFile && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                선택된 파일: {businessLicenseFile.name}
              </p>
            )}
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="photos" className="text-xs sm:text-sm">사진 (여러 장 선택 가능)</Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoFilesChange}
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
            {photoFiles.length > 0 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {photoFiles.length}개 파일 선택됨
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">포인트 정산</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">단가</span>
            <span className="font-medium">{pricePerUnit.toLocaleString()} P / 타</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">총 타수</span>
            <span className="font-medium">{totalCount} 타</span>
          </div>
          <div className="border-t pt-2 sm:pt-3 flex justify-between">
            <span className="text-sm sm:text-base font-semibold">필요 포인트</span>
            <span className="font-bold text-base sm:text-lg">{totalPoints.toLocaleString()} P</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">현재 보유 포인트</span>
            <span className={hasEnoughPoints ? 'text-green-600' : 'text-destructive'}>
              {currentPoints.toLocaleString()} P
            </span>
          </div>
          {!hasEnoughPoints && (
            <p className="text-xs sm:text-sm text-destructive">포인트가 부족합니다</p>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-3 sm:p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-2 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="h-9 sm:h-10 text-xs sm:text-sm"
        >
          취소
        </Button>
        <Button type="submit" disabled={loading || !isFormValid || !hasEnoughPoints} className="h-9 sm:h-10 text-xs sm:text-sm">
          {loading ? '접수 중...' : '접수하기'}
        </Button>
      </div>
    </form>
  );
}
