'use client';

import { Upload, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileUploadSectionProps {
  file: File | null;
  isLoading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  onReset: () => void;
}

export function FileUploadSection({
  file,
  isLoading,
  onFileChange,
  onAnalyze,
  onReset,
}: FileUploadSectionProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium mb-3">2. 엑셀 파일 업로드</h3>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileChange}
            className="cursor-pointer"
          />
        </div>
        {file && (
          <>
            <Button onClick={onAnalyze} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  파일 분석
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onReset}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {file && <p className="text-sm text-muted-foreground mt-2">선택된 파일: {file.name}</p>}
    </div>
  );
}
