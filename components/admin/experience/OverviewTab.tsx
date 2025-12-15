'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExperienceSubmission } from '@/types/experience-blogger';
import { getExperienceTypeName } from './constants';

interface OverviewTabProps {
  submission: ExperienceSubmission;
  onViewImages: () => void;
}

export function OverviewTab({ submission, onViewImages }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards submission={submission} />

      {/* 2열 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 기본 정보 */}
        <div className="space-y-6">
          <BasicInfoCard submission={submission} />
          {submission.keywords && submission.keywords.length > 0 && (
            <KeywordsCard keywords={submission.keywords} />
          )}
          {submission.available_days && submission.available_days.length > 0 && (
            <ScheduleCard submission={submission} />
          )}
        </div>

        {/* 오른쪽: 상세 내용 */}
        <div className="space-y-6">
          {submission.guide_text && <GuidelineCard guideText={submission.guide_text} />}
          {submission.provided_items && <ProvidedItemsCard providedItems={submission.provided_items} />}
          {submission.image_urls && submission.image_urls.length > 0 && (
            <ImagePreviewCard submission={submission} onViewImages={onViewImages} />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCards({ submission }: { submission: ExperienceSubmission }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-violet-500">
        <CardHeader className="pb-2">
          <p className="text-xs text-muted-foreground">거래처</p>
          <CardTitle className="text-xl truncate">{submission.company_name}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <p className="text-xs text-muted-foreground">서비스</p>
          <CardTitle className="text-xl">{getExperienceTypeName(submission.experience_type)}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <p className="text-xs text-muted-foreground">팀 수량</p>
          <CardTitle className="text-xl">{submission.team_count}팀</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-2">
          <p className="text-xs text-muted-foreground">포인트</p>
          <CardTitle className="text-xl text-violet-600">{submission.total_points.toLocaleString()}P</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

function BasicInfoCard({ submission }: { submission: ExperienceSubmission }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">업체명</span>
          <span className="font-medium">{submission.company_name}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">접수일</span>
          <span className="font-medium">
            {new Date(submission.created_at).toLocaleDateString('ko-KR')}
          </span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">상태</span>
          <Badge variant={submission.status === 'completed' ? 'secondary' : 'default'}>
            {submission.status === 'completed' ? '완료' : '진행중'}
          </Badge>
        </div>
        <div className="py-2">
          <span className="text-gray-500 block mb-2">장소 URL</span>
          <a
            href={submission.place_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-xs break-all"
          >
            {submission.place_url || 'N/A'}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function KeywordsCard({ keywords }: { keywords: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">타겟 키워드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <Badge key={index} variant="outline" className="text-sm">
              {keyword}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleCard({ submission }: { submission: ExperienceSubmission }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">방문 가능 일정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">요일</span>
          <span className="font-medium">{submission.available_days?.join(', ')}</span>
        </div>
        {submission.available_time_start && submission.available_time_end && (
          <div className="flex justify-between py-2">
            <span className="text-gray-500">시간</span>
            <span className="font-medium">
              {submission.available_time_start} ~ {submission.available_time_end}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GuidelineCard({ guideText }: { guideText: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">가이드라인</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
          {guideText}
        </div>
      </CardContent>
    </Card>
  );
}

function ProvidedItemsCard({ providedItems }: { providedItems: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">제공 내역</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
          {providedItems}
        </div>
      </CardContent>
    </Card>
  );
}

function ImagePreviewCard({
  submission,
  onViewImages,
}: {
  submission: ExperienceSubmission;
  onViewImages: () => void;
}) {
  if (!submission.image_urls || submission.image_urls.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">첨부 이미지</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewImages}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            전체 보기 →
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {submission.image_urls.slice(0, 6).map((url: string, index: number) => (
            <div key={index} className="relative group cursor-pointer" onClick={onViewImages}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`이미지 ${index + 1}`}
                className="w-full h-20 object-cover rounded border border-gray-200 group-hover:border-blue-500 transition-colors"
              />
              {index === 5 && submission.image_urls && submission.image_urls.length > 6 && (
                <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    +{submission.image_urls.length - 6}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
