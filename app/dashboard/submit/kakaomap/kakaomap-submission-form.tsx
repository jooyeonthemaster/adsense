'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface KakaomapSubmissionFormProps {
  clientId: string;
  pricePerUnit: number;
  currentPoints: number;
}

export function KakaomapSubmissionForm({
  clientId,
  pricePerUnit,
  currentPoints,
}: KakaomapSubmissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [kakaoPlaceUrl, setKakaoPlaceUrl] = useState('');
  const [totalCount, setTotalCount] = useState(10);
  const [totalPoints, setTotalPoints] = useState(0);
  const [script, setScript] = useState('');
  const [scriptConfirmed, setScriptConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  // Calculate total points when count changes
  useEffect(() => {
    const calculated = pricePerUnit * totalCount;
    setTotalPoints(calculated);
  }, [pricePerUnit, totalCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!companyName || !kakaoPlaceUrl || !totalCount) {
        setError('필수 항목을 모두 입력해주세요.');
        setLoading(false);
        return;
      }

      if (totalCount < 10) {
        setError('최소 10타 이상 입력해주세요.');
        setLoading(false);
        return;
      }

      if (!scriptConfirmed) {
        setError('스크립트를 확인해주세요.');
        setLoading(false);
        return;
      }

      if (totalPoints > currentPoints) {
        setError('포인트가 부족합니다.');
        setLoading(false);
        return;
      }

      // Submit the form
      const response = await fetch('/api/submissions/kakaomap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName,
          kakaomap_url: kakaoPlaceUrl,
          total_count: totalCount,
          total_points: totalPoints,
          text_review_count: 0,
          photo_review_count: 0,
          photo_urls: [],
          script,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '접수에 실패했습니다.');
        return;
      }

      // Success - Force full page reload to ensure fresh data
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : '접수 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    companyName && kakaoPlaceUrl && totalCount >= 10 && scriptConfirmed;
  const hasEnoughPoints = totalPoints <= currentPoints;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">접수 정보</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            카카오맵 리뷰 서비스 정보를 입력해주세요 (최소 10타)
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
            <Label htmlFor="kakao_place_url" className="text-xs sm:text-sm">
              카카오맵 장소 URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kakao_place_url"
              type="url"
              value={kakaoPlaceUrl}
              onChange={(e) => setKakaoPlaceUrl(e.target.value)}
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
              min="10"
              value={totalCount}
              onChange={(e) => setTotalCount(parseInt(e.target.value) || 10)}
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">최소 10타 이상</p>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="script" className="text-xs sm:text-sm">리뷰 스크립트 (선택사항)</Label>
            <Textarea
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="리뷰 작성 시 사용할 스크립트를 입력하세요"
              rows={5}
              disabled={loading}
              className="text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="script_confirmed"
              checked={scriptConfirmed}
              onCheckedChange={(checked) =>
                setScriptConfirmed(checked === true)
              }
              disabled={loading}
            />
            <label
              htmlFor="script_confirmed"
              className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              제공된 스크립트에 따라 리뷰를 작성하겠습니다{' '}
              <span className="text-destructive">*</span>
            </label>
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
          <CardTitle className="text-base sm:text-lg lg:text-xl">포인트 정산</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">단가</span>
            <span className="font-medium">
              {pricePerUnit.toLocaleString()} P / 타
            </span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">총 타수</span>
            <span className="font-medium">{totalCount} 타</span>
          </div>
          <div className="border-t pt-2 sm:pt-3 flex justify-between">
            <span className="text-sm sm:text-base font-semibold">필요 포인트</span>
            <span className="font-bold text-base sm:text-lg">
              {totalPoints.toLocaleString()} P
            </span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">현재 보유 포인트</span>
            <span
              className={hasEnoughPoints ? 'text-green-600' : 'text-destructive'}
            >
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
