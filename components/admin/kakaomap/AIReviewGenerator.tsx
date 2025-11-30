'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Sparkles,
  Settings2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Wand2,
  RotateCcw,
  FileText,
  Store,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { RatioSlider } from './RatioSlider';
import { ReviewPreviewList } from './ReviewPreviewList';
import { StoreInfoEditor } from './StoreInfoEditor';

import {
  BusinessType,
  GeneratedReview,
  RatioSliderConfig,
  AIReviewGenerateRequest,
  AIReviewGenerateResponse,
  DEFAULT_LENGTH_RATIOS,
  DEFAULT_TONE_RATIOS,
  DEFAULT_EMOJI_RATIOS,
  BUSINESS_TYPE_OPTIONS,
  StoreInfo,
  DEFAULT_STORE_INFO,
} from '@/types/review/ai-generation';
import { getBusinessPrompt, detectBusinessType } from '@/lib/review-prompts';

interface AIReviewGeneratorProps {
  submissionId: string;
  companyName: string;
  currentCount: number;
  totalCount: number;
  onSaveComplete: () => void;
}

type Step = 'config' | 'generating' | 'preview';

export function AIReviewGenerator({
  submissionId,
  companyName,
  currentCount,
  totalCount,
  onSaveComplete,
}: AIReviewGeneratorProps) {
  const { toast } = useToast();

  // 생성 설정 상태
  const [step, setStep] = useState<Step>('config');
  const [keyword, setKeyword] = useState(companyName);
  const [count, setCount] = useState(Math.max(1, Math.min(10, totalCount - currentCount)));
  const [businessType, setBusinessType] = useState<BusinessType>(() =>
    detectBusinessType(companyName)
  );
  const [customPrompt, setCustomPrompt] = useState('');
  const [editingPrompt, setEditingPrompt] = useState('');

  // 비율 설정
  const [lengthRatios, setLengthRatios] = useState<RatioSliderConfig[]>(DEFAULT_LENGTH_RATIOS);
  const [toneRatios, setToneRatios] = useState<RatioSliderConfig[]>(DEFAULT_TONE_RATIOS);
  const [emojiRatios, setEmojiRatios] = useState<RatioSliderConfig[]>(DEFAULT_EMOJI_RATIOS);

  // 매장 정보
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => ({
    ...DEFAULT_STORE_INFO,
    name: companyName,
  }));

  // 상세 설정 펼침/접기
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPromptEdit, setShowPromptEdit] = useState(false);
  const [showStoreInfo, setShowStoreInfo] = useState(false);

  // 생성 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedReviews, setGeneratedReviews] = useState<GeneratedReview[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false);

  // 남은 등록 가능 수량
  const remainingCount = totalCount - currentCount;
  // 생성은 최대 500개까지 가능 (저장 시에만 remainingCount 체크)
  const maxGenerateCount = 500;

  // 현재 프롬프트
  const currentPrompt = useMemo(
    () => customPrompt || getBusinessPrompt(businessType),
    [customPrompt, businessType]
  );

  // 기본 프롬프트
  const defaultPrompt = useMemo(
    () => getBusinessPrompt(businessType),
    [businessType]
  );

  // 프롬프트 편집 열기
  const handleOpenPromptEdit = useCallback((open: boolean) => {
    if (open) {
      setEditingPrompt(currentPrompt);
    }
    setShowPromptEdit(open);
  }, [currentPrompt]);

  // 프롬프트 저장
  const handleSavePrompt = useCallback(() => {
    const trimmed = editingPrompt.trim();
    if (trimmed && trimmed !== defaultPrompt) {
      setCustomPrompt(trimmed);
      toast({
        title: '프롬프트 저장됨',
        description: '커스텀 프롬프트가 적용되었습니다.',
      });
    } else {
      setCustomPrompt('');
    }
  }, [editingPrompt, defaultPrompt, toast]);

  // 프롬프트 기본값 복원
  const handleResetPrompt = useCallback(() => {
    setEditingPrompt(defaultPrompt);
    setCustomPrompt('');
    toast({
      title: '기본값 복원',
      description: '프롬프트가 기본값으로 복원되었습니다.',
    });
  }, [defaultPrompt, toast]);

  // 키워드 변경 시 업종 자동 감지 및 매장명 업데이트
  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    setStoreInfo(prev => ({ ...prev, name: value }));
    const detected = detectBusinessType(value);
    if (detected !== 'general') {
      setBusinessType(detected);
    }
  }, []);

  // 매장 정보에 데이터가 있는지 확인
  const hasStoreInfo = useMemo(() => {
    return Boolean(storeInfo.additional_info?.trim());
  }, [storeInfo.additional_info]);

  // AI 리뷰 생성
  const handleGenerate = useCallback(async () => {
    if (!keyword.trim()) {
      toast({
        title: '오류',
        description: '업체명/키워드를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (count < 1 || count > maxGenerateCount) {
      toast({
        title: '오류',
        description: `생성 수량은 1~${maxGenerateCount}개 사이여야 합니다.`,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress(0);
    setStep('generating');

    try {
      const request: AIReviewGenerateRequest = {
        submission_id: submissionId,
        keyword: keyword.trim(),
        count,
        business_type: businessType,
        length_ratios: lengthRatios.map((r) => ({
          value: r.value,
          percentage: r.percentage,
        })),
        tone_ratios: toneRatios.map((r) => ({
          value: r.value,
          percentage: r.percentage,
        })),
        emoji_ratios: emojiRatios.map((r) => ({
          value: r.value,
          percentage: r.percentage,
        })),
        custom_prompt: customPrompt || undefined,
        store_info: hasStoreInfo ? storeInfo : undefined,
      };

      // 프로그레스 시뮬레이션 (실제 API는 스트리밍 미지원)
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const response = await fetch('/api/admin/kakaomap/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      clearInterval(progressInterval);

      const data: AIReviewGenerateResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI 리뷰 생성에 실패했습니다.');
      }

      setGenerationProgress(100);
      setGeneratedReviews(data.reviews);
      setStep('preview');

      toast({
        title: '생성 완료',
        description: `${data.reviews.length}개의 리뷰가 생성되었습니다.`,
      });
    } catch (error) {
      console.error('생성 오류:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'AI 리뷰 생성 중 오류가 발생했습니다.'
      );
      setStep('config');
      toast({
        title: '생성 실패',
        description: error instanceof Error ? error.message : '오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    keyword,
    count,
    maxGenerateCount,
    submissionId,
    businessType,
    lengthRatios,
    toneRatios,
    emojiRatios,
    customPrompt,
    hasStoreInfo,
    storeInfo,
    toast,
  ]);

  // 개별 리뷰 업데이트
  const handleUpdateReview = useCallback(
    (id: string, updates: Partial<GeneratedReview>) => {
      setGeneratedReviews((prev) =>
        prev.map((review) =>
          review.id === id ? { ...review, ...updates } : review
        )
      );
    },
    []
  );

  // 개별 리뷰 삭제
  const handleDeleteReview = useCallback((id: string) => {
    setGeneratedReviews((prev) => prev.filter((review) => review.id !== id));
  }, []);

  // 개별 리뷰 재생성
  const handleRegenerateReview = useCallback(
    async (id: string) => {
      const review = generatedReviews.find((r) => r.id === id);
      if (!review) return;

      try {
        const response = await fetch('/api/admin/kakaomap/generate-reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: keyword.trim(),
            business_type: businessType,
            length_type: review.length_type,
            tone_type: review.tone_type,
            has_emoji: review.has_emoji,
            custom_prompt: customPrompt || undefined,
            store_info: hasStoreInfo ? storeInfo : undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || '재생성에 실패했습니다.');
        }

        setGeneratedReviews((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...data.review,
                  id, // 기존 ID 유지
                  selected: r.selected, // 선택 상태 유지
                }
              : r
          )
        );

        toast({
          title: '재생성 완료',
          description: '리뷰가 새로 생성되었습니다.',
        });
      } catch (error) {
        toast({
          title: '재생성 실패',
          description:
            error instanceof Error ? error.message : '오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    },
    [generatedReviews, keyword, businessType, customPrompt, hasStoreInfo, storeInfo, toast]
  );

  // 선택된 리뷰 저장
  const handleSaveSelected = useCallback(async () => {
    const selectedReviews = generatedReviews.filter((r) => r.selected);

    if (selectedReviews.length === 0) {
      toast({
        title: '선택 필요',
        description: '저장할 리뷰를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedReviews.length > remainingCount) {
      toast({
        title: '초과',
        description: `최대 ${remainingCount}개까지 저장 가능합니다.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // 각 리뷰를 순차적으로 저장
      let savedCount = 0;

      for (const review of selectedReviews) {
        const response = await fetch(
          `/api/admin/kakaomap/${submissionId}/content`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              script_text: review.script_text,
            }),
          }
        );

        if (response.ok) {
          savedCount++;
        }
      }

      toast({
        title: '저장 완료',
        description: `${savedCount}개의 리뷰가 저장되었습니다.`,
      });

      // 저장된 리뷰 목록에서 제거
      setGeneratedReviews((prev) =>
        prev.filter((r) => !r.selected)
      );

      // 부모 컴포넌트에 알림
      onSaveComplete();

      // 모두 저장했으면 설정 화면으로
      if (generatedReviews.length === selectedReviews.length) {
        setStep('config');
        setGeneratedReviews([]);
      }
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '일부 리뷰 저장에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [generatedReviews, remainingCount, submissionId, toast, onSaveComplete]);

  // 설정 화면으로 돌아가기
  const handleBackToConfig = useCallback(() => {
    setStep('config');
  }, []);

  // 설정 화면
  if (step === 'config') {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 리뷰 원고 생성
            </CardTitle>
            <CardDescription>
              Gemini AI가 자연스러운 리뷰 원고를 자동으로 생성합니다.
              {remainingCount > 0 ? (
                <Badge variant="outline" className="ml-2">
                  {remainingCount}개 추가 등록 가능
                </Badge>
              ) : (
                <Badge variant="destructive" className="ml-2">
                  등록 가능 수량 없음
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 에러 표시 */}
            {generationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}

            {/* 기본 설정 */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 키워드 입력 */}
              <div className="space-y-2">
                <Label htmlFor="keyword">업체명/키워드</Label>
                <Input
                  id="keyword"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  placeholder="예: 송도 한우집투뿔사위"
                />
              </div>

              {/* 생성 수량 */}
              <div className="space-y-2">
                <Label htmlFor="count">생성 수량</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) =>
                    setCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  현재 {currentCount}/{totalCount}개 등록됨
                  {remainingCount <= 0 && (
                    <span className="text-amber-600 ml-1">(초과 - 생성은 가능)</span>
                  )}
                </p>
              </div>
            </div>

            {/* 업종 선택 */}
            <div className="space-y-2">
              <Label>업종 선택</Label>
              <Select
                value={businessType}
                onValueChange={(value) => setBusinessType(value as BusinessType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BUSINESS_TYPE_OPTIONS).map(([value, { label, icon }]) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 매장 정보 입력 (Collapsible) */}
            <Collapsible open={showStoreInfo} onOpenChange={setShowStoreInfo}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    hasStoreInfo && "border-green-500 bg-green-50 dark:bg-green-950/20"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    매장 정보 입력
                    {hasStoreInfo && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        입력됨
                      </Badge>
                    )}
                  </span>
                  {showStoreInfo ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <StoreInfoEditor
                  storeInfo={storeInfo}
                  onChange={setStoreInfo}
                />
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* 프롬프트 편집 (Collapsible) */}
            <Collapsible open={showPromptEdit} onOpenChange={handleOpenPromptEdit}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    customPrompt && "border-primary bg-primary/5"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    프롬프트 설정
                    {customPrompt && (
                      <Badge variant="secondary" className="text-xs">
                        커스텀
                      </Badge>
                    )}
                  </span>
                  {showPromptEdit ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* 프롬프트 설명 */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>AI가 리뷰를 생성할 때 사용하는 프롬프트를 수정할 수 있습니다.</p>
                  <p className="text-xs">
                    사용 가능한 변수: <code className="bg-muted px-1 rounded">{'{keyword}'}</code> (업체명),
                    <code className="bg-muted px-1 rounded ml-1">{'{length}'}</code> (글자수),
                    <code className="bg-muted px-1 rounded ml-1">{'{tone}'}</code> (말투),
                    <code className="bg-muted px-1 rounded ml-1">{'{emoji}'}</code> (이모티콘)
                  </p>
                </div>

                {/* 프롬프트 편집 영역 */}
                <div className="space-y-2">
                  <Textarea
                    value={editingPrompt}
                    onChange={(e) => setEditingPrompt(e.target.value)}
                    placeholder="AI에게 전달할 리뷰 작성 지침을 입력하세요..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{editingPrompt.length}자</span>
                    {editingPrompt !== defaultPrompt && (
                      <span className="text-yellow-600">수정됨</span>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetPrompt}
                    className="gap-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    기본값으로
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePrompt}
                    disabled={!editingPrompt.trim()}
                    className="gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    프롬프트 적용
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* 상세 설정 (비율) */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    상세 비율 설정
                  </span>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 pt-4">
                {/* 글자수 비율 */}
                <RatioSlider
                  title="글자수 비율"
                  icon="📏"
                  items={lengthRatios}
                  onChange={setLengthRatios}
                />

                <Separator />

                {/* 말투 비율 */}
                <RatioSlider
                  title="말투 타겟 비율"
                  icon="🗣️"
                  items={toneRatios}
                  onChange={setToneRatios}
                />

                <Separator />

                {/* 이모티콘 비율 */}
                <RatioSlider
                  title="이모티콘 비율"
                  icon="😊"
                  items={emojiRatios}
                  onChange={setEmojiRatios}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* 생성 버튼 */}
            <Button
              onClick={handleGenerate}
              disabled={!keyword.trim()}
              className="w-full gap-2"
              size="lg"
            >
              <Wand2 className="h-5 w-5" />
              {count}개 리뷰 생성하기
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // 생성 중 화면
  if (step === 'generating') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">AI가 리뷰를 생성하고 있습니다</h3>
              <p className="text-sm text-muted-foreground">
                {count}개의 리뷰를 생성 중입니다. 잠시만 기다려주세요...
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {generationProgress}% 완료
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 미리보기 화면
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBackToConfig} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          설정으로 돌아가기
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          {generatedReviews.length}개 생성 완료
        </div>
      </div>

      {/* 미리보기 목록 */}
      <ReviewPreviewList
        reviews={generatedReviews}
        onUpdateReview={handleUpdateReview}
        onDeleteReview={handleDeleteReview}
        onRegenerateReview={handleRegenerateReview}
        onSaveSelected={handleSaveSelected}
        isSaving={isSaving}
        maxSaveCount={remainingCount}
      />
    </div>
  );
}
