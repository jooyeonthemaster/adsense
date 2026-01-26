'use client';

import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  ParsedSubmissionRecord,
  BulkValidationResponse,
} from '../types';

interface ValidationPreviewProps {
  records: ParsedSubmissionRecord[];
  validationResponse?: BulkValidationResponse | null;
  isValidating: boolean;
  isSubmitting: boolean;
  onValidate: () => void;
  onSubmit: () => void;
}

export function ValidationPreview({
  records,
  validationResponse,
  isValidating,
  isSubmitting,
  onValidate,
  onSubmit,
}: ValidationPreviewProps) {
  const validCount = records.filter((r) => r.isValid).length;
  const invalidCount = records.filter((r) => !r.isValid).length;

  // 서버 검증 결과 병합
  const mergedRecords = records.map((record) => {
    if (validationResponse?.results) {
      const serverResult = validationResponse.results.find((r) => r.row === record.row);
      if (serverResult) {
        return {
          ...record,
          isValid: record.isValid && serverResult.isValid,
          errors: [...record.errors, ...serverResult.errors],
          calculatedPoints: serverResult.calculatedPoints,
          pricePerUnit: serverResult.pricePerUnit,
        };
      }
    }
    return record;
  });

  const canSubmit =
    validationResponse?.summary &&
    validationResponse.summary.invalidCount === 0 &&
    !validationResponse.summary.hasInsufficientPoints;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
            3
          </span>
          검증 및 미리보기
        </CardTitle>
        <CardDescription>
          업로드된 데이터를 확인하고 검증해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 요약 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-2xl font-bold">{records.length}</p>
            <p className="text-xs text-gray-500">전체 건수</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">
              {validationResponse?.summary?.validCount ?? validCount}
            </p>
            <p className="text-xs text-gray-500">유효</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">
              {validationResponse?.summary?.invalidCount ?? invalidCount}
            </p>
            <p className="text-xs text-gray-500">오류</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">
              {validationResponse?.summary?.totalPoints?.toLocaleString() ?? '-'}
            </p>
            <p className="text-xs text-gray-500">예상 포인트</p>
          </div>
        </div>

        {/* 포인트 잔액 정보 */}
        {validationResponse?.summary && (
          <Alert
            variant={
              validationResponse.summary.hasInsufficientPoints
                ? 'destructive'
                : 'default'
            }
          >
            <AlertDescription className="flex items-center justify-between">
              <span>
                현재 잔액:{' '}
                <strong>
                  {validationResponse.summary.currentBalance.toLocaleString()}P
                </strong>
              </span>
              <span>
                차감 후 예상 잔액:{' '}
                <strong
                  className={
                    validationResponse.summary.hasInsufficientPoints
                      ? 'text-red-600'
                      : 'text-green-600'
                  }
                >
                  {validationResponse.summary.remainingBalance.toLocaleString()}P
                </strong>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* 데이터 테이블 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-16 text-center">행</TableHead>
                  <TableHead className="w-20 text-center">상태</TableHead>
                  <TableHead>상품</TableHead>
                  <TableHead className="text-right">예상 포인트</TableHead>
                  <TableHead>오류</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedRecords.map((record) => (
                  <TableRow
                    key={record.row}
                    className={!record.isValid ? 'bg-red-50' : ''}
                  >
                    <TableCell className="text-center font-mono">
                      {record.row}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {getProductLabel(record.productType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {record.calculatedPoints
                        ? `${record.calculatedPoints.toLocaleString()}P`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.errors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {record.errors.map((error, idx) => (
                            <Badge
                              key={idx}
                              variant="destructive"
                              className="text-xs font-normal"
                            >
                              {error}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {!validationResponse ? (
            <Button
              onClick={onValidate}
              disabled={isValidating || invalidCount > 0}
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  서버 검증 중...
                </>
              ) : invalidCount > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  오류 수정 필요 ({invalidCount}건)
                </>
              ) : (
                '서버 검증 시작'
              )}
            </Button>
          ) : (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !canSubmit}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  접수 처리 중...
                </>
              ) : !canSubmit ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {validationResponse.summary.hasInsufficientPoints
                    ? '포인트 부족'
                    : '오류 수정 필요'}
                </>
              ) : (
                `대량 접수하기 (${validationResponse.summary.totalPoints.toLocaleString()}P)`
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getProductLabel(productType: string): string {
  const labels: Record<string, string> = {
    receipt: '영수증 리뷰',
    blog_reviewer: '리뷰어 배포',
    blog_video: '247 배포',
    blog_automation: '자동화 배포',
    place: '트래픽/리워드',
  };
  return labels[productType] || productType;
}
