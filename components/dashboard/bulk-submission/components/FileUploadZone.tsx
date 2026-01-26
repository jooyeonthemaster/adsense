'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  file: File | null;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
  onReset: () => void;
}

export function FileUploadZone({
  file,
  isLoading,
  onFileSelect,
  onAnalyze,
  onReset,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && isExcelFile(droppedFile)) {
        onFileSelect(droppedFile);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const isExcelFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    return (
      validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">
            2
          </span>
          파일 업로드
        </CardTitle>
        <CardDescription>작성된 엑셀 파일을 업로드해주세요.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-400">.xlsx, .xls 파일만 가능</p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {file && (
          <div className="flex gap-2">
            <Button
              onClick={onAnalyze}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                '파일 분석하기'
              )}
            </Button>
            <Button variant="outline" onClick={onReset} disabled={isLoading}>
              초기화
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
