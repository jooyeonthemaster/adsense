'use client';

import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ValidationResult } from '../types';
import { RecordsTable } from './RecordsTable';

interface ValidationPreviewProps {
  validationResult: ValidationResult;
  activeTab: string;
  isDeploying: boolean;
  onTabChange: (tab: string) => void;
  onDeploy: () => void;
}

export function ValidationPreview({
  validationResult,
  activeTab,
  isDeploying,
  onTabChange,
  onDeploy,
}: ValidationPreviewProps) {
  return (
    <div className="p-4 border rounded-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">3. 데이터 미리보기 및 검증</h3>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            유효: {validationResult.validRecords}건
          </Badge>
          {validationResult.invalidRecords > 0 && (
            <Badge variant="outline" className="text-red-600 border-red-600">
              <XCircle className="h-3 w-3 mr-1" />
              오류: {validationResult.invalidRecords}건
            </Badge>
          )}
        </div>
      </div>

      {/* 빈 시트 경고 */}
      {validationResult.sheets.length === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>데이터 없음</AlertTitle>
          <AlertDescription>
            유효한 시트가 없습니다. 시트 이름이 올바른지 확인하세요. (K맵리뷰, 방문자리뷰, 블로그배포,
            카페침투)
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* 탭 네비게이션 */}
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList>
              {validationResult.sheets.map((sheet) => (
                <TabsTrigger key={sheet.productType} value={sheet.productType}>
                  {sheet.productName}
                  <Badge variant="secondary" className="ml-2">
                    {sheet.records.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 탭 콘텐츠 */}
            {validationResult.sheets.map((sheet) => (
              <TabsContent key={sheet.productType} value={sheet.productType}>
                <RecordsTable sheet={sheet} />
                <div className="mt-2 text-sm text-muted-foreground">
                  유효: {sheet.validCount}건 / 오류: {sheet.invalidCount}건
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* 배포 버튼 */}
          {validationResult.validRecords > 0 && (
            <div className="mt-6 flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-medium text-green-800">4. 데이터 배포</h3>
                <p className="text-sm text-green-600">
                  {validationResult.validRecords}건의 데이터가 데이터베이스에 저장됩니다.
                  {validationResult.invalidRecords > 0 &&
                    ` (${validationResult.invalidRecords}건 오류 제외)`}
                </p>
              </div>
              <Button
                onClick={onDeploy}
                disabled={isDeploying}
                className="bg-green-600 hover:bg-green-700"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    배포하기
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
