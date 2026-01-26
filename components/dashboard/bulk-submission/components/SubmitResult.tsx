'use client';

import { CheckCircle, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { BulkSubmitResponse } from '../types';

interface SubmitResultProps {
  result: BulkSubmitResponse;
  onReset: () => void;
}

export function SubmitResult({ result, onReset }: SubmitResultProps) {
  const isSuccess = result.success && !result.rolledBack;
  const isPartialSuccess = result.success && result.summary.failedCount > 0;
  const isRolledBack = result.rolledBack;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
            4
          </span>
          접수 결과
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 결과 알림 */}
        <Alert
          variant={isSuccess ? 'default' : 'destructive'}
          className={isSuccess ? 'border-green-500 bg-green-50' : ''}
        >
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : isRolledBack ? (
            <RotateCcw className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <AlertTitle>
            {isSuccess
              ? '대량 접수 완료'
              : isRolledBack
              ? '접수 실패 (롤백됨)'
              : '접수 실패'}
          </AlertTitle>
          <AlertDescription>
            {isSuccess ? (
              <>
                총 <strong>{result.summary.successCount}건</strong>의 접수가
                완료되었습니다.
                {result.summary.newBalance !== undefined && (
                  <>
                    {' '}
                    잔여 포인트:{' '}
                    <strong>{result.summary.newBalance.toLocaleString()}P</strong>
                  </>
                )}
              </>
            ) : isRolledBack ? (
              <>
                오류가 발생하여 모든 접수가 취소되었습니다. 포인트는 차감되지
                않았습니다.
                <br />
                오류: {result.error}
              </>
            ) : (
              result.error || '알 수 없는 오류가 발생했습니다.'
            )}
          </AlertDescription>
        </Alert>

        {/* 성공 시 요약 정보 */}
        {isSuccess && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {result.summary.successCount}
              </p>
              <p className="text-xs text-gray-500">성공</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold">
                {result.summary.totalPoints.toLocaleString()}P
              </p>
              <p className="text-xs text-gray-500">차감 포인트</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">
                {result.summary.newBalance.toLocaleString()}P
              </p>
              <p className="text-xs text-gray-500">잔여 포인트</p>
            </div>
          </div>
        )}

        {/* 성공한 접수 목록 */}
        {isSuccess && result.results && result.results.length > 0 && (
          <div className="border rounded-lg p-4 max-h-[200px] overflow-auto">
            <p className="text-sm font-medium mb-2">접수번호 목록</p>
            <div className="flex flex-wrap gap-2">
              {result.results
                .filter((r) => r.success && r.submissionNumber)
                .map((r) => (
                  <span
                    key={r.row}
                    className="px-2 py-1 bg-gray-100 rounded text-xs font-mono"
                  >
                    {r.submissionNumber}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* 새로 시작 버튼 */}
        <Button onClick={onReset} variant="outline" className="w-full">
          새로운 대량 접수
        </Button>
      </CardContent>
    </Card>
  );
}
