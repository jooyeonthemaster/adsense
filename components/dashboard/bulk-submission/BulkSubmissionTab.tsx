'use client';

import { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import {
  TemplateDownload,
  FileUploadZone,
  ValidationPreview,
  SubmitResult,
} from './components';
import { parseBulkSubmissionFile, validateBulkSubmission, submitBulkSubmission } from './utils';
import type {
  BulkSubmissionProduct,
  BulkUploadStatus,
  ParsedSubmissionRecord,
  BulkValidationResponse,
  BulkSubmitResponse,
} from './types';

interface BulkSubmissionTabProps {
  productType?: BulkSubmissionProduct;
  showAllTemplates?: boolean;
}

export function BulkSubmissionTab({
  productType,
  showAllTemplates = false,
}: BulkSubmissionTabProps) {
  // 상태 관리
  const [status, setStatus] = useState<BulkUploadStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ParsedSubmissionRecord[]>([]);
  const [validationResponse, setValidationResponse] = useState<BulkValidationResponse | null>(null);
  const [submitResponse, setSubmitResponse] = useState<BulkSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setRecords([]);
    setValidationResponse(null);
    setSubmitResponse(null);
    setError(null);
    setStatus('idle');
  }, []);

  // 파일 분석 핸들러
  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    setStatus('parsing');
    setError(null);

    try {
      const parsedRecords = await parseBulkSubmissionFile(file, productType);

      if (parsedRecords.length === 0) {
        setError('유효한 데이터가 없습니다. 템플릿 양식을 확인해주세요.');
        setStatus('error');
        return;
      }

      setRecords(parsedRecords);
      setStatus('preview');
    } catch (err) {
      console.error('파일 분석 오류:', err);
      setError(err instanceof Error ? err.message : '파일 분석 중 오류가 발생했습니다.');
      setStatus('error');
    }
  }, [file, productType]);

  // 서버 검증 핸들러
  const handleValidate = useCallback(async () => {
    if (records.length === 0) return;

    setStatus('validating');
    setError(null);

    try {
      const response = await validateBulkSubmission(records, productType);
      setValidationResponse(response);

      // 검증 결과를 레코드에 반영
      const updatedRecords = records.map((record) => {
        const serverResult = response.results.find((r) => r.row === record.row);
        if (serverResult) {
          return {
            ...record,
            isValid: record.isValid && serverResult.isValid,
            errors: [...record.errors, ...serverResult.errors],
            calculatedPoints: serverResult.calculatedPoints,
            pricePerUnit: serverResult.pricePerUnit,
          };
        }
        return record;
      });
      setRecords(updatedRecords);
      setStatus('preview');
    } catch (err) {
      console.error('서버 검증 오류:', err);
      setError(err instanceof Error ? err.message : '서버 검증 중 오류가 발생했습니다.');
      setStatus('error');
    }
  }, [records, productType]);

  // 접수 제출 핸들러
  const handleSubmit = useCallback(async () => {
    if (records.length === 0 || !validationResponse) return;

    setStatus('submitting');
    setError(null);

    try {
      const response = await submitBulkSubmission(records, productType);
      setSubmitResponse(response);

      if (response.success) {
        setStatus('success');
      } else {
        setError(response.error || '접수 처리 중 오류가 발생했습니다.');
        setStatus('error');
      }
    } catch (err) {
      console.error('접수 제출 오류:', err);
      setError(err instanceof Error ? err.message : '접수 처리 중 오류가 발생했습니다.');
      setStatus('error');
    }
  }, [records, productType, validationResponse]);

  // 초기화 핸들러
  const handleReset = useCallback(() => {
    setFile(null);
    setRecords([]);
    setValidationResponse(null);
    setSubmitResponse(null);
    setError(null);
    setStatus('idle');
  }, []);

  const isLoading = status === 'parsing';
  const isValidating = status === 'validating';
  const isSubmitting = status === 'submitting';

  return (
    <div className="space-y-6">
      {/* 오류 알림 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 성공 결과가 있으면 결과만 표시 */}
      {submitResponse?.success ? (
        <SubmitResult result={submitResponse} onReset={handleReset} />
      ) : (
        <>
          {/* Step 1: 템플릿 다운로드 */}
          <TemplateDownload productType={productType} showAllTemplates={showAllTemplates} />

          {/* Step 2: 파일 업로드 */}
          <FileUploadZone
            file={file}
            isLoading={isLoading}
            onFileSelect={handleFileSelect}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
          />

          {/* Step 3: 검증 및 미리보기 */}
          {records.length > 0 && (
            <ValidationPreview
              records={records}
              validationResponse={validationResponse}
              isValidating={isValidating}
              isSubmitting={isSubmitting}
              onValidate={handleValidate}
              onSubmit={handleSubmit}
            />
          )}
        </>
      )}
    </div>
  );
}
