'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PlaceSubmissionFormProps {
  clientId: string;
  pricePerUnit: number;
  currentPoints: number;
}

export function PlaceSubmissionForm({
  pricePerUnit,
  currentPoints,
}: PlaceSubmissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dailyCount, setDailyCount] = useState(100);
  const [totalDays, setTotalDays] = useState(3);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const calculated = pricePerUnit * dailyCount * totalDays;
    setTotalPoints(calculated);
  }, [pricePerUnit, dailyCount, totalDays]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (dailyCount < 100) {
      setError('최소 일 100타 이상 입력해주세요.');
      return;
    }

    if (totalDays < 3 || totalDays > 7) {
      setError('구동일수는 최소 3일, 최대 7일입니다.');
      return;
    }

    if (totalPoints > currentPoints) {
      setError(`포인트가 부족합니다. (필요: ${totalPoints.toLocaleString()} P, 보유: ${currentPoints.toLocaleString()} P)`);
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      company_name: formData.get('company_name') as string,
      place_url: formData.get('place_url') as string,
      daily_count: dailyCount,
      total_days: totalDays,
      total_points: totalPoints,
      notes: formData.get('notes') as string,
    };

    try {
      const response = await fetch('/api/submissions/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '접수에 실패했습니다.');
        return;
      }

      router.push('/dashboard/submissions');
      router.refresh();
    } catch (err) {
      setError('접수 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">접수 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="company_name" className="text-xs sm:text-sm">
              업체명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="업체명을 입력하세요"
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="place_url" className="text-xs sm:text-sm">
              플레이스 URL (모바일 링크) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="place_url"
              name="place_url"
              type="url"
              placeholder="https://m.place.naver.com/..."
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="daily_count" className="text-xs sm:text-sm">
                일 접수량 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="daily_count"
                name="daily_count"
                type="number"
                min="100"
                value={dailyCount}
                onChange={(e) => setDailyCount(parseInt(e.target.value) || 100)}
                disabled={loading}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">최소 100타</p>
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="total_days" className="text-xs sm:text-sm">
                구동일수 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="total_days"
                name="total_days"
                type="number"
                min="3"
                max="7"
                value={totalDays}
                onChange={(e) => setTotalDays(parseInt(e.target.value) || 3)}
                disabled={loading}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">최소 3일 ~ 최대 7일</p>
            </div>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">비고</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="추가 요청사항이 있으면 입력하세요"
              disabled={loading}
              className="text-xs sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">포인트 계산</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">단가</span>
            <span className="font-medium">{pricePerUnit.toLocaleString()} P</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">일 접수량</span>
            <span className="font-medium">{dailyCount.toLocaleString()}타</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">구동일수</span>
            <span className="font-medium">{totalDays}일</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-sm sm:text-base font-semibold">총 차감 포인트</span>
              <span className="text-base sm:text-lg font-bold text-primary">
                {totalPoints.toLocaleString()} P
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm mt-1">
              <span className="text-muted-foreground">보유 포인트</span>
              <span className={currentPoints >= totalPoints ? 'text-green-600' : 'text-destructive'}>
                {currentPoints.toLocaleString()} P
              </span>
            </div>
          </div>
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
        <Button type="submit" disabled={loading || totalPoints > currentPoints} className="h-9 sm:h-10 text-xs sm:text-sm">
          {loading ? '접수 중...' : '접수하기'}
        </Button>
      </div>
    </form>
  );
}
