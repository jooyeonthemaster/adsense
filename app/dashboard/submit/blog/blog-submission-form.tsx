'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogSubmissionFormProps {
  clientId: string;
  reviewerPrice: number | null;
  videoPrice: number | null;
  automationPrice: number | null;
  currentPoints: number;
}

type BlogType = 'reviewer' | 'video' | 'automation';

const BLOG_TYPE_LABELS: Record<BlogType, string> = {
  reviewer: '리뷰어형',
  video: '영상형',
  automation: '자동화형',
};

export function BlogSubmissionForm({
  clientId,
  reviewerPrice,
  videoPrice,
  automationPrice,
  currentPoints,
}: BlogSubmissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [distributionType, setDistributionType] = useState<BlogType>('reviewer');
  const [contentType, setContentType] = useState<'review' | 'info'>('review');
  const [placeUrl, setPlaceUrl] = useState('');
  const [dailyCount, setDailyCount] = useState(1);
  const [totalDays, setTotalDays] = useState(1);
  const [totalCount, setTotalCount] = useState(1);
  const [totalPoints, setTotalPoints] = useState(0);
  const [keywords, setKeywords] = useState('');
  const [notes, setNotes] = useState('');

  // Get current price based on selected type
  const getCurrentPrice = (): number | null => {
    switch (distributionType) {
      case 'reviewer':
        return reviewerPrice;
      case 'video':
        return videoPrice;
      case 'automation':
        return automationPrice;
      default:
        return null;
    }
  };

  // Calculate total count and points when values change
  useEffect(() => {
    const count = dailyCount * totalDays;
    setTotalCount(count);

    const price = getCurrentPrice();
    if (price) {
      const calculated = price * count;
      setTotalPoints(calculated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distributionType, dailyCount, totalDays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!companyName || !distributionType || !contentType || !placeUrl || !dailyCount || !totalDays) {
        setError('필수 항목을 모두 입력해주세요.');
        setLoading(false);
        return;
      }

      if (dailyCount < 1 || dailyCount > 3) {
        setError('일 타수는 최소 1타, 최대 3타입니다.');
        setLoading(false);
        return;
      }

      if (totalCount > 30) {
        setError('총 타수는 최대 30타입니다.');
        setLoading(false);
        return;
      }

      if (totalPoints > currentPoints) {
        setError('포인트가 부족합니다.');
        setLoading(false);
        return;
      }

      const price = getCurrentPrice();
      if (!price) {
        setError('선택한 블로그 타입의 가격 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // Submit the form
      const response = await fetch('/api/submissions/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName,
          distribution_type: distributionType,
          content_type: contentType,
          place_url: placeUrl,
          daily_count: dailyCount,
          total_count: totalCount,
          total_points: totalPoints,
          keywords,
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

  const currentPrice = getCurrentPrice();
  const isFormValid =
    companyName &&
    distributionType &&
    contentType &&
    placeUrl &&
    dailyCount >= 1 &&
    dailyCount <= 3 &&
    totalCount <= 30 &&
    currentPrice;
  const hasEnoughPoints = totalPoints <= currentPoints;

  // Available blog types based on pricing
  const availableTypes: BlogType[] = [];
  if (reviewerPrice) availableTypes.push('reviewer');
  if (videoPrice) availableTypes.push('video');
  if (automationPrice) availableTypes.push('automation');

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">접수 정보</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            블로그 배포 서비스 정보를 입력해주세요
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
            <Label htmlFor="distribution_type" className="text-xs sm:text-sm">
              배포 타입 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={distributionType}
              onValueChange={(value) => setDistributionType(value as BlogType)}
              disabled={loading}
            >
              <SelectTrigger id="distribution_type" className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="배포 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-xs sm:text-sm">
                    {BLOG_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="content_type" className="text-xs sm:text-sm">
              콘텐츠 타입 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={contentType}
              onValueChange={(value) => setContentType(value as 'review' | 'info')}
              disabled={loading}
            >
              <SelectTrigger id="content_type" className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="콘텐츠 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="review" className="text-xs sm:text-sm">리뷰형</SelectItem>
                <SelectItem value="info" className="text-xs sm:text-sm">정보형</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="place_url" className="text-xs sm:text-sm">
              플레이스 URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="place_url"
              type="url"
              value={placeUrl}
              onChange={(e) => setPlaceUrl(e.target.value)}
              placeholder="https://..."
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="daily_count" className="text-xs sm:text-sm">
              일 타수 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="daily_count"
              type="number"
              min="1"
              max="3"
              value={dailyCount}
              onChange={(e) => setDailyCount(parseInt(e.target.value) || 1)}
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              일 최소 1타, 최대 3타
            </p>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="total_days" className="text-xs sm:text-sm">
              총 일수 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="total_days"
              type="number"
              min="1"
              value={totalDays}
              onChange={(e) => setTotalDays(parseInt(e.target.value) || 1)}
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <div className="p-3 sm:p-4 bg-muted rounded-md">
              <p className="text-xs sm:text-sm font-medium">
                총 타수: {totalCount} 타
                {totalCount > 30 && (
                  <span className="text-destructive ml-2">
                    (최대 30타 초과)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="keywords" className="text-xs sm:text-sm">키워드 (선택사항)</Label>
            <Textarea
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="블로그 포스팅에 사용할 키워드를 입력하세요"
              disabled={loading}
              className="text-xs sm:text-sm"
            />
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
            <span className="text-muted-foreground">배포 타입</span>
            <span className="font-medium">{BLOG_TYPE_LABELS[distributionType]}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">단가</span>
            <span className="font-medium">
              {currentPrice ? `${currentPrice.toLocaleString()} P / 타` : '-'}
            </span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">일 타수 × 총 일수</span>
            <span className="font-medium">
              {dailyCount} × {totalDays} = {totalCount} 타
            </span>
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
