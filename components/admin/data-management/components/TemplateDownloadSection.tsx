'use client';

import { FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplateDownloadSectionProps {
  onDownload: () => void;
}

export function TemplateDownloadSection({ onDownload }: TemplateDownloadSectionProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
      <FileSpreadsheet className="h-8 w-8 text-blue-600" />
      <div className="flex-1">
        <h3 className="font-medium">1. 엑셀 템플릿 다운로드</h3>
        <p className="text-sm text-muted-foreground">
          템플릿 파일을 다운로드하여 데이터를 입력하세요. 각 시트별로 상품이 구분됩니다.
        </p>
      </div>
      <Button variant="outline" onClick={onDownload}>
        <Download className="h-4 w-4 mr-2" />
        템플릿 다운로드
      </Button>
    </div>
  );
}
