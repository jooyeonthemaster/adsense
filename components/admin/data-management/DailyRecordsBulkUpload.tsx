'use client';

import { useState, useCallback } from 'react';
import type {
  CategoryType,
  ValidationResult,
  DeployResult,
  DailyRecordsBulkUploadProps,
} from './types';
import { CATEGORY_PRODUCTS } from './constants';
import { downloadTemplate, parseAndValidateFile, deployToDatabase } from './utils';
import {
  TemplateDownloadSection,
  FileUploadSection,
  ValidationPreview,
  DeployResultAlert,
} from './components';

export function DailyRecordsBulkUpload({ category = 'all' }: DailyRecordsBulkUploadProps) {
  // 현재 카테고리에 포함된 상품 목록
  const allowedProducts = CATEGORY_PRODUCTS[category];

  // 상태 관리
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  // 템플릿 다운로드 핸들러
  const handleDownloadTemplate = useCallback(() => {
    downloadTemplate(category, allowedProducts);
  }, [category, allowedProducts]);

  // 파일 선택 핸들러
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
      setDeployResult(null);
    }
  }, []);

  // 엑셀 파싱 및 검증 핸들러
  const handleAnalyze = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setDeployResult(null);

    try {
      const result = await parseAndValidateFile(file, allowedProducts);
      setValidationResult(result);

      if (result.sheets.length > 0) {
        setActiveTab(result.sheets[0].productType);
      }
    } catch (error) {
      console.error('파싱 오류:', error);
      setDeployResult({
        success: false,
        message: '엑셀 파일 파싱 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [file, allowedProducts]);

  // 배포 핸들러
  const handleDeploy = useCallback(async () => {
    if (!validationResult || validationResult.validRecords === 0) return;

    setIsDeploying(true);

    try {
      const result = await deployToDatabase(validationResult);
      setDeployResult(result);

      // 성공 시 초기화
      if (result.success) {
        setFile(null);
        setValidationResult(null);
      }
    } finally {
      setIsDeploying(false);
    }
  }, [validationResult]);

  // 초기화 핸들러
  const handleReset = useCallback(() => {
    setFile(null);
    setValidationResult(null);
    setDeployResult(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Step 1: 템플릿 다운로드 */}
      <TemplateDownloadSection onDownload={handleDownloadTemplate} />

      {/* Step 2: 파일 업로드 */}
      <FileUploadSection
        file={file}
        isLoading={isLoading}
        onFileChange={handleFileChange}
        onAnalyze={handleAnalyze}
        onReset={handleReset}
      />

      {/* Step 3: 미리보기 및 검증 결과 */}
      {validationResult && (
        <ValidationPreview
          validationResult={validationResult}
          activeTab={activeTab}
          isDeploying={isDeploying}
          onTabChange={setActiveTab}
          onDeploy={handleDeploy}
        />
      )}

      {/* 결과 알림 */}
      {deployResult && <DeployResultAlert deployResult={deployResult} />}
    </div>
  );
}
