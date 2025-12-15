'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Download } from 'lucide-react';
import type { ExperienceSubmission } from '@/types/experience-blogger';

interface ImagesTabProps {
  submission: ExperienceSubmission;
  downloadingImages: boolean;
  onDownloadAllImages: () => void;
}

export function ImagesTab({ submission, downloadingImages, onDownloadAllImages }: ImagesTabProps) {
  if (!submission.image_urls || submission.image_urls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                첨부된 이미지 ({submission.image_urls.length}개)
              </CardTitle>
              <CardDescription>고객이 제출한 이미지 파일</CardDescription>
            </div>
            <Button
              onClick={onDownloadAllImages}
              disabled={downloadingImages}
              variant="outline"
            >
              {downloadingImages ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  다운로드 중...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  전체 다운로드 (ZIP)
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {submission.image_urls.map((url: string, index: number) => (
              <div key={index} className="relative group">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:border-sky-500 transition-colors cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">
                      새 탭에서 열기
                    </span>
                  </div>
                </a>
                <div className="absolute bottom-2 right-2">
                  <a
                    href={url}
                    download
                    className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4 text-gray-700" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
