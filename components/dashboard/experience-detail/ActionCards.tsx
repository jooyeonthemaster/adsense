'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, CheckCircle2, MessageCircle } from 'lucide-react';

interface BloggerSelectionActionProps {
  onSelect: () => void;
}

export function BloggerSelectionAction({ onSelect }: BloggerSelectionActionProps) {
  return (
    <Card className="border-violet-200 bg-violet-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-600" />
          블로거 선택이 필요합니다
        </CardTitle>
        <CardDescription>
          관리자가 등록한 블로거 목록에서 원하시는 분들을 선택해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onSelect} className="bg-violet-600">
          <Users className="h-4 w-4 mr-2" />
          블로거 선택하기
        </Button>
      </CardContent>
    </Card>
  );
}

interface ScheduleConfirmActionProps {
  onConfirm: () => void;
  onInquiry: () => void;
}

export function ScheduleConfirmAction({ onConfirm, onInquiry }: ScheduleConfirmActionProps) {
  return (
    <Card className="border-violet-200 bg-violet-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-600" />
          방문 일정 확인이 필요합니다
        </CardTitle>
        <CardDescription>
          관리자가 등록한 방문 일정을 확인하고 승인해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onConfirm} className="bg-violet-600">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          일정 확인 및 승인
        </Button>
        <Button variant="outline" onClick={onInquiry}>
          <MessageCircle className="h-4 w-4 mr-2" />
          일정 조율 요청 (1:1 문의)
        </Button>
      </CardContent>
    </Card>
  );
}
