'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface AIReviewGeneratingStepProps {
  count: number;
  generationProgress: number;
}

export function AIReviewGeneratingStep({ count, generationProgress }: AIReviewGeneratingStepProps) {
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
            <p className="text-xs text-muted-foreground">{generationProgress}% 완료</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
