'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Settings2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Wand2,
  RotateCcw,
  FileText,
  Store,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import { RatioSlider } from './RatioSlider';
import { StoreInfoEditor } from './StoreInfoEditor';

import {
  BusinessType,
  RatioSliderConfig,
  BUSINESS_TYPE_OPTIONS,
  StoreInfo,
} from '@/types/review/ai-generation';

export interface AIReviewConfigStepProps {
  // Config state
  keyword: string;
  count: number;
  businessType: BusinessType;
  setBusinessType: (type: BusinessType) => void;
  editingPrompt: string;
  setEditingPrompt: (prompt: string) => void;

  // Ratios
  lengthRatios: RatioSliderConfig[];
  setLengthRatios: (ratios: RatioSliderConfig[]) => void;
  toneRatios: RatioSliderConfig[];
  setToneRatios: (ratios: RatioSliderConfig[]) => void;
  emojiRatios: RatioSliderConfig[];
  setEmojiRatios: (ratios: RatioSliderConfig[]) => void;

  // Store info
  storeInfo: StoreInfo;
  setStoreInfo: (info: StoreInfo) => void;
  hasStoreInfo: boolean;

  // UI toggles
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  showPromptEdit: boolean;
  showStoreInfo: boolean;
  setShowStoreInfo: (show: boolean) => void;

  // Computed values
  remainingCount: number;
  currentCount: number;
  totalCount: number;
  customPrompt: string;
  defaultPrompt: string;
  generationError: string | null;

  // Handlers
  onKeywordChange: (value: string) => void;
  onCountChange: (newCount: number) => void;
  onOpenPromptEdit: (open: boolean) => void;
  onSavePrompt: () => void;
  onResetPrompt: () => void;
  onGenerate: () => Promise<void>;
}

export function AIReviewConfigStep({
  keyword,
  count,
  businessType,
  setBusinessType,
  editingPrompt,
  setEditingPrompt,
  lengthRatios,
  setLengthRatios,
  toneRatios,
  setToneRatios,
  emojiRatios,
  setEmojiRatios,
  storeInfo,
  setStoreInfo,
  hasStoreInfo,
  showAdvanced,
  setShowAdvanced,
  showPromptEdit,
  showStoreInfo,
  setShowStoreInfo,
  remainingCount,
  currentCount,
  totalCount,
  customPrompt,
  defaultPrompt,
  generationError,
  onKeywordChange,
  onCountChange,
  onOpenPromptEdit,
  onSavePrompt,
  onResetPrompt,
  onGenerate,
}: AIReviewConfigStepProps) {
  return (
    <div className="space-y-6">
        {/* 에러 표시 */}
        {generationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
        )}

        {/* 기본 설정 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="keyword">업체명/키워드</Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder="예: 송도 한우집투뿔사위"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">생성 수량</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => onCountChange(parseInt(e.target.value) || 1)}
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

        {/* 매장 정보 입력 */}
        <Collapsible open={showStoreInfo} onOpenChange={setShowStoreInfo}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-between',
                hasStoreInfo && 'border-green-500 bg-green-50 dark:bg-green-950/20'
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
              {showStoreInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <StoreInfoEditor storeInfo={storeInfo} onChange={setStoreInfo} />
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* 프롬프트 편집 */}
        <Collapsible open={showPromptEdit} onOpenChange={onOpenPromptEdit}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className={cn('w-full justify-between', customPrompt && 'border-primary bg-primary/5')}
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
              {showPromptEdit ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>AI가 리뷰를 생성할 때 사용하는 프롬프트를 수정할 수 있습니다.</p>
              <p className="text-xs">
                사용 가능한 변수: <code className="bg-muted px-1 rounded">{'{keyword}'}</code> (업체명),
                <code className="bg-muted px-1 rounded ml-1">{'{length}'}</code> (글자수),
                <code className="bg-muted px-1 rounded ml-1">{'{tone}'}</code> (말투),
                <code className="bg-muted px-1 rounded ml-1">{'{emoji}'}</code> (이모티콘)
              </p>
            </div>

            <div className="space-y-2">
              <Textarea
                value={editingPrompt}
                onChange={(e) => setEditingPrompt(e.target.value)}
                placeholder="AI에게 전달할 리뷰 작성 지침을 입력하세요..."
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{editingPrompt.length}자</span>
                {editingPrompt !== defaultPrompt && <span className="text-yellow-600">수정됨</span>}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={onResetPrompt} className="gap-1">
                <RotateCcw className="h-4 w-4" />
                기본값으로
              </Button>
              <Button size="sm" onClick={onSavePrompt} disabled={!editingPrompt.trim()} className="gap-1">
                <CheckCircle2 className="h-4 w-4" />
                프롬프트 적용
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* 상세 설정 */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:hover:bg-blue-900"
            >
              <span className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-300">
                <Settings2 className="h-4 w-4" />
                📊 글자수 / 말투 / 이모티콘 설정
              </span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 pt-4">
            <RatioSlider
              title="글자수 배분"
              icon="📏"
              items={lengthRatios}
              totalCount={count}
              onChange={setLengthRatios}
            />

            <Separator />

            <RatioSlider
              title="말투 타겟 배분"
              icon="🗣️"
              items={toneRatios}
              totalCount={count}
              onChange={setToneRatios}
            />

            <Separator />

            <RatioSlider
              title="이모티콘 배분"
              icon="😊"
              items={emojiRatios}
              totalCount={count}
              onChange={setEmojiRatios}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* 생성 버튼 */}
        <Button onClick={onGenerate} disabled={!keyword.trim()} className="w-full gap-2" size="lg">
          <Wand2 className="h-5 w-5" />
          {count}개 리뷰 생성하기
        </Button>
    </div>
  );
}
