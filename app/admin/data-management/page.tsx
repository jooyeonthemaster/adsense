'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyRecordsBulkUpload } from '@/components/admin/data-management/DailyRecordsBulkUpload';
import { FileSpreadsheet, Upload, MapPin, FileText, Coffee } from 'lucide-react';

// 카테고리별 설정
const CATEGORY_CONFIG = {
  all: {
    title: '통합 업로드',
    description: '엑셀 파일을 업로드하여 모든 상품의 일별 유입 기록을 한 번에 등록합니다. 각 상품별로 시트를 구분하여 작성해주세요.',
    icon: FileSpreadsheet,
  },
  review: {
    title: '리뷰 마케팅',
    description: '카카오맵 리뷰, 방문자 리뷰의 일별 유입 기록을 등록합니다.',
    icon: MapPin,
  },
  blog: {
    title: '블로그 배포',
    description: '블로그 배포(영상/자동화/리뷰어)의 일별 완료 기록을 등록합니다.',
    icon: FileText,
  },
  cafe: {
    title: '침투 마케팅',
    description: '카페 침투 및 커뮤니티 마케팅의 일별 완료 기록을 등록합니다.',
    icon: Coffee,
  },
} as const;

type CategoryType = keyof typeof CATEGORY_CONFIG;

export default function DataManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">데이터 관리</h1>
        <p className="text-muted-foreground">엑셀 파일을 통한 일괄 데이터 등록</p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(CATEGORY_CONFIG) as CategoryType[]).map((key) => {
            const config = CATEGORY_CONFIG[key];
            const Icon = config.icon;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(CATEGORY_CONFIG) as CategoryType[]).map((key) => {
          const config = CATEGORY_CONFIG[key];
          const Icon = config.icon;
          return (
            <TabsContent key={key} value={key}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    {config.title} - 일별 기록 등록
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <DailyRecordsBulkUpload category={key} />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
