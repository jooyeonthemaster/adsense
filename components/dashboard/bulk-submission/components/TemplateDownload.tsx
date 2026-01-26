'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BulkSubmissionProduct } from '../types';
import { downloadBulkTemplate, downloadAllTemplates } from '../utils';

interface TemplateDownloadProps {
  productType?: BulkSubmissionProduct;
  showAllTemplates?: boolean;
}

export function TemplateDownload({ productType, showAllTemplates = false }: TemplateDownloadProps) {
  const handleDownload = () => {
    if (productType) {
      downloadBulkTemplate(productType);
    } else {
      downloadAllTemplates();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
            1
          </span>
          템플릿 다운로드
        </CardTitle>
        <CardDescription>
          엑셀 양식을 다운로드하여 데이터를 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleDownload} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          {productType ? '템플릿 다운로드' : '통합 템플릿 다운로드'}
        </Button>
        {showAllTemplates && productType && (
          <Button
            onClick={() => downloadAllTemplates()}
            variant="ghost"
            className="gap-2 ml-2"
          >
            <Download className="w-4 h-4" />
            모든 상품 템플릿
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
