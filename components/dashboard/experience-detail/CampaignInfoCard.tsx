'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ExperienceSubmission } from './types';
import { EXPERIENCE_TYPE_LABELS } from './constants';

interface CampaignInfoCardProps {
  submission: ExperienceSubmission;
}

export function CampaignInfoCard({ submission }: CampaignInfoCardProps) {
  // Parse guide_text into sections
  const parseGuideText = () => {
    if (!submission.guide_text) return null;

    const lines = submission.guide_text.split('\n');
    const sections: { title: string; content: string }[] = [];
    let currentTitle = '';
    let currentContent: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.match(/^\[.+\]$/)) {
        if (currentTitle && currentContent.length > 0) {
          sections.push({ title: currentTitle, content: currentContent.join('\n') });
        }
        currentTitle = trimmed.replace(/^\[|\]$/g, '');
        currentContent = [];
      } else if (trimmed) {
        currentContent.push(trimmed);
      }
    });

    if (currentTitle && currentContent.length > 0) {
      sections.push({ title: currentTitle, content: currentContent.join('\n') });
    }

    // Merge visit days and time
    const visitDaysIdx = sections.findIndex((s) => s.title === '방문가능요일' || s.title === '방문가능일');
    const visitTimeIdx = sections.findIndex((s) => s.title === '방문가능시간');

    if (visitDaysIdx !== -1 && visitTimeIdx !== -1) {
      sections[visitDaysIdx].content = `${sections[visitDaysIdx].content} / ${sections[visitTimeIdx].content}`;
      sections.splice(visitTimeIdx, 1);
    }

    return sections;
  };

  const sections = parseGuideText();

  return (
    <Card>
      <CardHeader>
        <CardTitle>캠페인 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {/* 체험단 유형 */}
          <div className="bg-white p-4">
            <p className="text-sm text-gray-500 mb-1">체험단 유형</p>
            <p className="font-medium">{EXPERIENCE_TYPE_LABELS[submission.experience_type]}</p>
          </div>

          {/* 모집 인원 */}
          <div className="bg-white p-4">
            <p className="text-sm text-gray-500 mb-1">모집 인원</p>
            <p className="font-medium">{submission.team_count}명</p>
          </div>

          {/* 신청일 */}
          <div className="bg-white p-4">
            <p className="text-sm text-gray-500 mb-1">신청일</p>
            <p className="font-medium">
              {new Date(submission.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* 사용 포인트 */}
          <div className="bg-white p-4">
            <p className="text-sm text-gray-500 mb-1">사용 포인트</p>
            <p className="font-semibold text-violet-600">{submission.total_points.toLocaleString()}P</p>
          </div>

          {/* 타겟 키워드 */}
          {submission.keywords && submission.keywords.length > 0 && (
            <div className="bg-white p-4 md:col-span-2">
              <p className="text-sm text-gray-500 mb-2">타겟 키워드</p>
              <div className="flex flex-wrap gap-2">
                {submission.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 안내사항 - parsed sections */}
          {sections && sections.length > 0 ? (
            sections.map((section, idx) => (
              <div key={idx} className="bg-white p-4">
                <p className="text-sm text-gray-500 mb-1">{section.title}</p>
                <p className="text-sm font-medium">{section.content}</p>
              </div>
            ))
          ) : submission.guide_text ? (
            <div className="bg-white p-4 md:col-span-2">
              <p className="text-sm text-gray-500 mb-2">안내사항</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{submission.guide_text}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
