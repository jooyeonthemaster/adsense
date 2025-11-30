'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  RotateCcw,
  Lightbulb,
  Copy,
  Check,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { BusinessType } from '@/types/review/ai-generation';
import { BUSINESS_PROMPTS, getBusinessPrompt } from '@/lib/review-prompts';

interface PromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessType: BusinessType;
  currentPrompt: string;
  onSave: (prompt: string) => void;
}

// 프롬프트 변수 설명
const PROMPT_VARIABLES = [
  { variable: '{keyword}', description: '업체명/키워드가 삽입됩니다' },
  { variable: '{length}', description: '글자수 조건이 삽입됩니다 (짧은/중간/긴)' },
  { variable: '{tone}', description: '말투 조건이 삽입됩니다 (20대/30대/...)' },
  { variable: '{emoji}', description: '이모티콘 사용 여부가 삽입됩니다' },
];

// 프롬프트 작성 팁
const PROMPT_TIPS = [
  '구체적인 작성 지침을 제공하면 더 자연스러운 리뷰가 생성됩니다.',
  '피해야 할 표현이나 금지 사항을 명시하면 품질이 향상됩니다.',
  '업종 특성에 맞는 키워드와 표현을 포함시키세요.',
  '너무 긴 프롬프트는 AI의 창의성을 제한할 수 있습니다.',
  '테스트를 통해 프롬프트를 점진적으로 개선하세요.',
];

export function PromptEditor({
  open,
  onOpenChange,
  businessType,
  currentPrompt,
  onSave,
}: PromptEditorProps) {
  const [editedPrompt, setEditedPrompt] = useState(currentPrompt);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'templates'>('edit');
  const [copied, setCopied] = useState(false);

  const businessConfig = BUSINESS_PROMPTS[businessType];
  const defaultPrompt = getBusinessPrompt(businessType);
  const hasChanges = editedPrompt !== currentPrompt;
  const isDefault = editedPrompt === defaultPrompt;

  // 기본값으로 리셋
  const handleReset = useCallback(() => {
    setEditedPrompt(defaultPrompt);
  }, [defaultPrompt]);

  // 저장
  const handleSave = useCallback(() => {
    onSave(editedPrompt);
    onOpenChange(false);
  }, [editedPrompt, onSave, onOpenChange]);

  // 변수 삽입
  const handleInsertVariable = useCallback(
    (variable: string) => {
      setEditedPrompt((prev) => prev + ' ' + variable);
    },
    []
  );

  // 복사
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(editedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editedPrompt]);

  // 다른 업종 프롬프트 적용
  const handleApplyTemplate = useCallback((type: BusinessType) => {
    setEditedPrompt(BUSINESS_PROMPTS[type].prompt);
    setActiveTab('edit');
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{businessConfig.icon}</span>
            {businessConfig.name} 프롬프트 편집
          </DialogTitle>
          <DialogDescription>
            AI가 리뷰를 생성할 때 사용하는 프롬프트를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit">편집</TabsTrigger>
            <TabsTrigger value="preview">미리보기</TabsTrigger>
            <TabsTrigger value="templates">다른 템플릿</TabsTrigger>
          </TabsList>

          {/* 편집 탭 */}
          <TabsContent value="edit" className="flex-1 space-y-4">
            <div className="grid gap-4">
              {/* 상태 표시 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDefault ? (
                    <Badge variant="secondary">기본 프롬프트</Badge>
                  ) : (
                    <Badge variant="default">커스텀 프롬프트</Badge>
                  )}
                  {hasChanges && (
                    <Badge variant="outline" className="text-yellow-600">
                      수정됨
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        복사
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    기본값으로
                  </Button>
                </div>
              </div>

              {/* 편집 영역 */}
              <div className="space-y-2">
                <Label>프롬프트 내용</Label>
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  placeholder="AI에게 전달할 리뷰 작성 지침을 입력하세요..."
                  className="min-h-[300px] font-mono text-sm"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{editedPrompt.length}자</span>
                </div>
              </div>

              {/* 변수 삽입 */}
              <div className="space-y-2">
                <Label className="text-sm">사용 가능한 변수</Label>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_VARIABLES.map(({ variable, description }) => (
                    <Button
                      key={variable}
                      variant="outline"
                      size="sm"
                      onClick={() => handleInsertVariable(variable)}
                      className="font-mono text-xs"
                      title={description}
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 팁 */}
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>팁:</strong>{' '}
                  {PROMPT_TIPS[Math.floor(Math.random() * PROMPT_TIPS.length)]}
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* 미리보기 탭 */}
          <TabsContent value="preview" className="flex-1">
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h4>현재 프롬프트 미리보기</h4>
                <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg font-mono text-sm">
                  {editedPrompt
                    .replace('{keyword}', '[송도 한우집투뿔사위]')
                    .replace('{length}', '[중간 (200-400자)]')
                    .replace('{tone}', '[30대]')
                    .replace('{emoji}', '[이모티콘 포함]')}
                </div>

                <h4 className="mt-6">변수 치환 예시</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">변수</th>
                      <th className="text-left">치환 값</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROMPT_VARIABLES.map(({ variable, description }) => (
                      <tr key={variable}>
                        <td className="font-mono">{variable}</td>
                        <td className="text-muted-foreground">{description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* 템플릿 탭 */}
          <TabsContent value="templates" className="flex-1">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {Object.entries(BUSINESS_PROMPTS).map(([type, config]) => (
                  <div
                    key={type}
                    className={cn(
                      'border rounded-lg p-4 cursor-pointer transition-all hover:border-primary',
                      type === businessType && 'border-primary bg-primary/5'
                    )}
                    onClick={() => handleApplyTemplate(type as BusinessType)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <span className="font-medium">{config.name}</span>
                        {type === businessType && (
                          <Badge variant="secondary" className="text-xs">
                            현재
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyTemplate(type as BusinessType);
                        }}
                      >
                        적용
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {config.prompt.slice(0, 200)}...
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!editedPrompt.trim()}>
            저장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
