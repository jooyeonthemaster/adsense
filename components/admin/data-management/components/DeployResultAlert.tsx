'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DeployResult } from '../types';

interface DeployResultAlertProps {
  deployResult: DeployResult;
}

export function DeployResultAlert({ deployResult }: DeployResultAlertProps) {
  return (
    <Alert variant={deployResult.success ? 'default' : 'destructive'}>
      {deployResult.success ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertTitle>{deployResult.success ? '완료' : '오류'}</AlertTitle>
      <AlertDescription>
        {deployResult.message}

        {/* 에러 목록 */}
        {deployResult.details && deployResult.details.errors.length > 0 && (
          <ul className="mt-2 text-sm list-disc list-inside">
            {deployResult.details.errors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {deployResult.details.errors.length > 5 && (
              <li>...외 {deployResult.details.errors.length - 5}건</li>
            )}
          </ul>
        )}

        {/* 진행률 디버그 정보 */}
        {deployResult.progressDebug && deployResult.progressDebug.length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md">
            <p className="font-medium text-gray-700 mb-2">📊 진행률 업데이트 디버그:</p>
            {deployResult.progressDebug.map((debug, i) => (
              <div key={i} className="text-xs font-mono mb-1">
                <span className="text-blue-600">{debug.submissionId.slice(0, 8)}...</span>
                {' | '}콘텐츠: <span className="text-green-600">{debug.contentCount ?? 'null'}</span>
                {' | '}목표: <span className="text-orange-600">{debug.totalCount}</span>
                {' | '}진행률:{' '}
                <span className="font-bold text-purple-600">{debug.progressPercentage}%</span>
                {' | '}상태: {debug.status}
                {debug.updateError && (
                  <span className="text-red-600 ml-2">❌ {debug.updateError}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
