'use client';

import { useState } from 'react';
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

interface AsRequestFormProps {
  clientId: string;
}

const SUBMISSION_TYPES = [
  { value: 'place', label: '플레이스 유입' },
  { value: 'receipt', label: '영수증 리뷰' },
  { value: 'kakaomap', label: '카카오맵 리뷰' },
  { value: 'blog', label: '블로그 배포' },
];

export function AsRequestForm({ clientId }: AsRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [submissionType, setSubmissionType] = useState<string>('');
  const [submissionId, setSubmissionId] = useState('');
  const [expectedCount, setExpectedCount] = useState<number>(0);
  const [actualCount, setActualCount] = useState<number>(0);
  const [missingRate, setMissingRate] = useState<number>(0);
  const [description, setDescription] = useState('');

  // Calculate missing rate when values change
  const calculateMissingRate = (expected: number, actual: number) => {
    if (expected === 0) return 0;
    const rate = ((expected - actual) / expected) * 100;
    return Math.max(0, Math.min(100, rate));
  };

  const handleExpectedCountChange = (value: number) => {
    setExpectedCount(value);
    const rate = calculateMissingRate(value, actualCount);
    setMissingRate(rate);
  };

  const handleActualCountChange = (value: number) => {
    setActualCount(value);
    const rate = calculateMissingRate(expectedCount, value);
    setMissingRate(rate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!submissionType || !submissionId || !expectedCount || !actualCount || !description) {
        setError('필수 항목을 모두 입력해주세요.');
        setLoading(false);
        return;
      }

      if (missingRate < 20) {
        setError('AS 신청은 미달률 20% 이상일 때만 가능합니다.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/as-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_type: submissionType,
          submission_id: submissionId,
          expected_count: expectedCount,
          actual_count: actualCount,
          missing_rate: missingRate,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'AS 신청에 실패했습니다.');
        return;
      }

      // Success
      alert('AS 신청이 완료되었습니다.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AS 신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">AS 신청 정보</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            서비스 미달 내용을 정확히 입력해주세요 (미달률 20% 이상 필요)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="submission_type" className="text-xs sm:text-sm">
              상품 유형 <span className="text-destructive">*</span>
            </Label>
            <Select value={submissionType} onValueChange={setSubmissionType}>
              <SelectTrigger id="submission_type" className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="상품 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {SUBMISSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-xs sm:text-sm">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="submission_id" className="text-xs sm:text-sm">
              접수 ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="submission_id"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="접수 내역에서 확인한 ID를 입력하세요"
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="expected_count" className="text-xs sm:text-sm">
              예정 수량 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="expected_count"
              type="number"
              min="0"
              value={expectedCount}
              onChange={(e) => handleExpectedCountChange(parseInt(e.target.value) || 0)}
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="actual_count" className="text-xs sm:text-sm">
              실제 달성 수량 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="actual_count"
              type="number"
              min="0"
              value={actualCount}
              onChange={(e) => handleActualCountChange(parseInt(e.target.value) || 0)}
              required
              disabled={loading}
              className="h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <div className="p-3 sm:p-4 bg-muted rounded-md">
              <p className="text-xs sm:text-sm font-medium">
                미달률: {missingRate.toFixed(1)}%
                {missingRate >= 20 ? (
                  <span className="text-green-600 ml-2">(AS 신청 가능)</span>
                ) : (
                  <span className="text-destructive ml-2">(AS 신청 불가 - 20% 이상 필요)</span>
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">
              상세 내용 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AS가 필요한 사유를 상세히 입력해주세요"
              rows={5}
              required
              disabled={loading}
              className="text-xs sm:text-sm"
            />
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
        <Button
          type="submit"
          disabled={loading || missingRate < 20}
          className="h-9 sm:h-10 text-xs sm:text-sm"
        >
          {loading ? 'AS 신청 중...' : 'AS 신청'}
        </Button>
      </div>
    </form>
  );
}
