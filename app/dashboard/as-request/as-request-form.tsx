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
import { AnySubmission } from '@/types/submission';
import { calculateExpectedCount, formatSubmissionLabel } from '@/lib/submission-utils';

interface AsRequestFormProps {
  clientId: string;
}

const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  dynamic: '기타 상품',
};

export function AsRequestForm({ clientId }: AsRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingSubmissions, setFetchingSubmissions] = useState(true);
  const [error, setError] = useState('');

  // 완료된 접수 내역 목록
  const [completedSubmissions, setCompletedSubmissions] = useState<AnySubmission[]>([]);

  // 선택된 접수 내역
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<AnySubmission | null>(null);

  // 폼 데이터
  const [submissionType, setSubmissionType] = useState<string>('');
  const [submissionId, setSubmissionId] = useState('');
  const [expectedCount, setExpectedCount] = useState<number>(0);
  const [actualCount, setActualCount] = useState<number>(0);
  const [missingRate, setMissingRate] = useState<number>(0);
  const [description, setDescription] = useState('');

  // 완료된 접수 내역 불러오기
  useEffect(() => {
    const fetchCompletedSubmissions = async () => {
      try {
        const response = await fetch('/api/submissions');
        if (!response.ok) {
          throw new Error('접수 내역을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        // 완료된 접수 내역만 필터링
        const completed = data.submissions.filter(
          (s: AnySubmission) => s.status === 'completed'
        );
        setCompletedSubmissions(completed);
      } catch (err) {
        setError(err instanceof Error ? err.message : '접수 내역 조회 중 오류가 발생했습니다.');
      } finally {
        setFetchingSubmissions(false);
      }
    };

    fetchCompletedSubmissions();
  }, []);

  // 접수 내역 선택 시 자동으로 데이터 채우기
  const handleSubmissionSelect = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);

    const submission = completedSubmissions.find((s) => s.id === submissionId);
    if (!submission) {
      setSelectedSubmission(null);
      return;
    }

    setSelectedSubmission(submission);

    // 자동으로 데이터 채우기
    setSubmissionType(submission.type);
    setSubmissionId(submission.id);

    const expected = calculateExpectedCount(submission);
    setExpectedCount(expected);

    // 실제 수량 초기화 (사용자가 입력해야 함)
    setActualCount(0);
    setMissingRate(0);
  };

  // Calculate missing rate when values change
  const calculateMissingRate = (expected: number, actual: number) => {
    if (expected === 0) return 0;
    const rate = ((expected - actual) / expected) * 100;
    return Math.max(0, Math.min(100, rate));
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
      if (!selectedSubmission || !expectedCount || !actualCount || !description) {
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
          {fetchingSubmissions ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">완료된 접수 내역을 불러오는 중...</p>
            </div>
          ) : completedSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                완료된 접수 내역이 없습니다. AS 신청을 하려면 먼저 접수를 완료해주세요.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="submission_select" className="text-xs sm:text-sm">
                  완료된 접수 내역 선택 <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedSubmissionId} onValueChange={handleSubmissionSelect}>
                  <SelectTrigger id="submission_select" className="h-auto min-h-[2.5rem] sm:min-h-[2.75rem] text-xs sm:text-sm">
                    <SelectValue placeholder="AS를 신청할 접수 내역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedSubmissions.map((submission) => (
                      <SelectItem
                        key={submission.id}
                        value={submission.id}
                        className="text-xs sm:text-sm py-3"
                      >
                        {formatSubmissionLabel(submission)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  완료된 접수 내역만 표시됩니다
                </p>
              </div>

              {selectedSubmission && (
                <>
                  <div className="grid gap-1.5 sm:gap-2">
                    <Label className="text-xs sm:text-sm">상품 유형</Label>
                    <Input
                      value={SUBMISSION_TYPE_LABELS[selectedSubmission.type] || selectedSubmission.type}
                      disabled
                      className="h-9 sm:h-10 text-xs sm:text-sm bg-muted"
                    />
                  </div>

                  <div className="grid gap-1.5 sm:gap-2">
                    <Label className="text-xs sm:text-sm">업체명</Label>
                    <Input
                      value={selectedSubmission.company_name}
                      disabled
                      className="h-9 sm:h-10 text-xs sm:text-sm bg-muted"
                    />
                  </div>

                  <div className="grid gap-1.5 sm:gap-2">
                    <Label className="text-xs sm:text-sm">예정 수량 (자동 계산)</Label>
                    <Input
                      value={`${expectedCount.toLocaleString()}개`}
                      disabled
                      className="h-9 sm:h-10 text-xs sm:text-sm bg-muted"
                    />
                  </div>
                </>
              )}

              {selectedSubmission && (
                <>
                  <div className="grid gap-1.5 sm:gap-2">
                    <Label htmlFor="actual_count" className="text-xs sm:text-sm">
                      실제 달성 수량 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="actual_count"
                      type="number"
                      min="0"
                      max={expectedCount}
                      value={actualCount || ''}
                      onChange={(e) => handleActualCountChange(parseInt(e.target.value) || 0)}
                      placeholder="실제로 달성한 수량을 입력하세요"
                      required
                      disabled={loading}
                      className="h-9 sm:h-10 text-xs sm:text-sm"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      예정 수량보다 작은 값을 입력하세요
                    </p>
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
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        미달 수량: {expectedCount - actualCount}개
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-1.5 sm:gap-2">
                    <Label htmlFor="description" className="text-xs sm:text-sm">
                      AS 신청 사유 <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="AS가 필요한 사유를 상세히 입력해주세요&#10;예: 실제 유입 수가 부족함, 리뷰 작성이 미달됨 등"
                      rows={5}
                      required
                      disabled={loading}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-3 sm:p-4 rounded-md">
          {error}
        </div>
      )}

      {!fetchingSubmissions && completedSubmissions.length > 0 && (
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
            disabled={loading || !selectedSubmission || missingRate < 20 || !actualCount || !description}
            className="h-9 sm:h-10 text-xs sm:text-sm"
          >
            {loading ? 'AS 신청 중...' : 'AS 신청'}
          </Button>
        </div>
      )}
    </form>
  );
}
