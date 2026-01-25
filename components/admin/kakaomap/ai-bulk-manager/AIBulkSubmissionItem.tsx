'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  Save,
  Send,
  ArrowLeft,
  Trash2,
  Settings2,
  ExternalLink,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { RatioSlider } from '@/components/admin/kakaomap/RatioSlider';
import {
  AISubmissionSummary,
  SubmissionProcessState,
  AIConfigState,
  STEP_CONFIG,
} from './types';
import {
  GeneratedReview,
  BusinessType,
  RatioSliderConfig,
  LENGTH_OPTIONS,
  TONE_OPTIONS,
} from '@/types/review/ai-generation';

interface AIBulkSubmissionItemProps {
  submission: AISubmissionSummary;
  state: SubmissionProcessState;
  onToggleExpand: () => void;
  onUpdateConfig: (updates: Partial<AIConfigState>) => void;
  onKeywordChange: (value: string) => void;
  onCountChange: (count: number) => void;
  onGenerate: () => void;
  onUpdateReview: (reviewId: string, updates: Partial<GeneratedReview>) => void;
  onDeleteReview: (reviewId: string) => void;
  onSaveSelected: () => void;
  onPublish: () => void;
  onBackToConfig: () => void;
}

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'general', label: '일반' },
  { value: 'restaurant', label: '음식점' },
  { value: 'cafe', label: '카페' },
  { value: 'beauty', label: '뷰티/미용' },
  { value: 'hospital', label: '병원/의료' },
  { value: 'fitness', label: '헬스/피트니스' },
  { value: 'accommodation', label: '숙박' },
  { value: 'education', label: '교육/학원' },
  { value: 'retail', label: '소매/쇼핑' },
  { value: 'pet', label: '펫샵/동물병원' },
  { value: 'auto', label: '자동차/정비' },
];

export function AIBulkSubmissionItem({
  submission,
  state,
  onToggleExpand,
  onUpdateConfig,
  onKeywordChange,
  onCountChange,
  onGenerate,
  onUpdateReview,
  onDeleteReview,
  onSaveSelected,
  onPublish,
  onBackToConfig,
}: AIBulkSubmissionItemProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const stepConfig = STEP_CONFIG[state.step];
  const selectedCount = state.generatedReviews.filter((r) => r.selected).length;

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = useCallback(() => {
    const reviews = state.generatedReviews;
    if (reviews.length === 0) return;

    const excelData = reviews.map((review, index) => ({
      '번호': index + 1,
      '리뷰 내용': review.script_text,
      '글자수': review.char_count,
      '길이': LENGTH_OPTIONS[review.length_type]?.label || review.length_type,
      '말투': TONE_OPTIONS[review.tone_type]?.label || review.tone_type,
      '이모티콘': review.has_emoji ? '포함' : '미포함',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '리뷰 목록');

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 80 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];

    const fileName = `${submission.company_name}_리뷰_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [state.generatedReviews, submission.company_name]);

  // Ratio 변경 핸들러들
  const handleLengthRatiosChange = useCallback(
    (ratios: RatioSliderConfig[]) => {
      onUpdateConfig({ lengthRatios: ratios });
    },
    [onUpdateConfig]
  );

  const handleToneRatiosChange = useCallback(
    (ratios: RatioSliderConfig[]) => {
      onUpdateConfig({ toneRatios: ratios });
    },
    [onUpdateConfig]
  );

  const handleEmojiRatiosChange = useCallback(
    (ratios: RatioSliderConfig[]) => {
      onUpdateConfig({ emojiRatios: ratios });
    },
    [onUpdateConfig]
  );

  return (
    <Card className={`transition-all ${state.isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
      {/* 헤더 (항상 표시) */}
      <Collapsible open={state.isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              {state.isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{submission.company_name}</span>
                  <span className="text-sm text-muted-foreground">
                    | {submission.client_name}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  남은 수량: {submission.remaining_count}/{submission.total_count}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 상세 페이지 이동 버튼 */}
              <Link
                href={`/admin/kakaomap/${submission.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>

              {/* 진행률 표시 (생성 중일 때) */}
              {state.isGenerating && (
                <div className="flex items-center gap-2 w-32">
                  <Progress value={state.generationProgress} className="h-2" />
                  <span className="text-sm text-muted-foreground">
                    {state.generationProgress}%
                  </span>
                </div>
              )}

              {/* 상태 뱃지 */}
              <Badge className={stepConfig.color}>
                {state.isGenerating && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {stepConfig.label}
              </Badge>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {/* 설정 단계 또는 생성 중 단계 */}
            {(state.step === 'config' || state.step === 'idle' || state.step === 'generating') && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                {/* 기본 설정 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label>업체명/키워드</Label>
                    <Input
                      value={state.config.keyword}
                      onChange={(e) => onKeywordChange(e.target.value)}
                      placeholder="업체명 입력"
                      disabled={state.isGenerating}
                    />
                  </div>
                  <div>
                    <Label>업종</Label>
                    <Select
                      value={state.config.businessType}
                      onValueChange={(v) => onUpdateConfig({ businessType: v as BusinessType })}
                      disabled={state.isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>생성 수량</Label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={state.config.count}
                      onChange={(e) => onCountChange(parseInt(e.target.value) || 1)}
                      disabled={state.isGenerating}
                    />
                  </div>
                </div>

                {/* 상세 설정 토글 */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Settings2 className="h-4 w-4 mr-1" />
                      상세 설정 {showAdvanced ? '접기' : '펼치기'}
                      <ChevronDown
                        className={`h-4 w-4 ml-1 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-6">
                    {/* 글자수 / 말투 / 이모티콘 설정 */}
                    <div className="bg-white rounded-lg border p-4 space-y-6">
                      <RatioSlider
                        title="글자수 배분"
                        icon="📏"
                        items={state.config.lengthRatios}
                        totalCount={state.config.count}
                        onChange={handleLengthRatiosChange}
                        disabled={state.isGenerating}
                      />
                      <RatioSlider
                        title="말투 타겟 배분"
                        icon="🗣️"
                        items={state.config.toneRatios}
                        totalCount={state.config.count}
                        onChange={handleToneRatiosChange}
                        disabled={state.isGenerating}
                      />
                      <RatioSlider
                        title="이모티콘 배분"
                        icon="😊"
                        items={state.config.emojiRatios}
                        totalCount={state.config.count}
                        onChange={handleEmojiRatiosChange}
                        disabled={state.isGenerating}
                      />
                    </div>

                    {/* 매장 정보 & 커스텀 프롬프트 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>매장 추가 정보 (선택)</Label>
                        <Textarea
                          value={state.config.storeInfo.additional_info || ''}
                          onChange={(e) =>
                            onUpdateConfig({
                              storeInfo: {
                                ...state.config.storeInfo,
                                additional_info: e.target.value,
                              },
                            })
                          }
                          placeholder="예: 시그니처 메뉴는 한우 불고기, 주차 가능, 단체석 있음"
                          className="h-24"
                          disabled={state.isGenerating}
                        />
                      </div>
                      <div>
                        <Label>커스텀 프롬프트 (선택)</Label>
                        <Textarea
                          value={state.config.customPrompt}
                          onChange={(e) => onUpdateConfig({ customPrompt: e.target.value })}
                          placeholder="AI에게 추가로 전달할 지시사항..."
                          className="h-24"
                          disabled={state.isGenerating}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* 에러 표시 */}
                {state.generationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {state.generationError}
                  </div>
                )}

                {/* 생성 버튼 */}
                <Button
                  onClick={onGenerate}
                  disabled={state.isGenerating || !state.config.keyword.trim()}
                  className="w-full"
                  size="lg"
                >
                  {state.isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      생성 중... ({state.generationProgress}%)
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      AI 리뷰 생성 시작
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* 미리보기 단계 */}
            {state.step === 'preview' && (
              <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBackToConfig}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      설정으로
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      생성된 리뷰: {state.generatedReviews.length}개 | 선택됨: {selectedCount}개
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 엑셀 다운로드 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExcelDownload}
                      disabled={state.generatedReviews.length === 0}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      엑셀
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        state.generatedReviews.forEach((r) =>
                          onUpdateReview(r.id, { selected: true })
                        );
                      }}
                    >
                      전체 선택
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        state.generatedReviews.forEach((r) =>
                          onUpdateReview(r.id, { selected: false })
                        );
                      }}
                    >
                      선택 해제
                    </Button>
                  </div>
                </div>

                {/* 리뷰 목록 */}
                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                  {state.generatedReviews.map((review, index) => (
                    <div
                      key={review.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        review.selected
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={review.selected}
                          onCheckedChange={(checked) =>
                            onUpdateReview(review.id, { selected: !!checked })
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              #{index + 1}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {LENGTH_OPTIONS[review.length_type]?.label || review.length_type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {TONE_OPTIONS[review.tone_type]?.label || review.tone_type}
                            </Badge>
                            {review.has_emoji && (
                              <Badge variant="outline" className="text-xs">
                                이모지
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {review.script_text.length}자
                            </span>
                          </div>
                          <Textarea
                            value={review.script_text}
                            onChange={(e) =>
                              onUpdateReview(review.id, { script_text: e.target.value })
                            }
                            className="min-h-[60px] text-sm resize-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onDeleteReview(review.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Button
                    onClick={onSaveSelected}
                    disabled={selectedCount === 0 || state.isSaving}
                    className="flex-1"
                  >
                    {state.isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    선택 저장 ({selectedCount}개)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onPublish}
                    disabled={state.isPublishing}
                  >
                    {state.isPublishing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    검수 요청
                  </Button>
                </div>
              </div>
            )}

            {/* 검수 요청 중 */}
            {state.step === 'publishing' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">검수 요청 중...</span>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
