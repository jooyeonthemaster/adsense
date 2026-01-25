'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Bot, Clock, Loader2, FileText } from 'lucide-react';
import { AIBulkStats } from './types';

interface AIBulkHeaderProps {
  stats: AIBulkStats;
}

export function AIBulkHeader({ stats }: AIBulkHeaderProps) {
  return (
    <div className="space-y-4">
      {/* 타이틀 */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">K맵 AI 리뷰 일괄 생성</h1>
          <p className="text-sm text-muted-foreground">
            AI 원고 접수건을 한 곳에서 관리하고 생성합니다
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">대기 중 접수건</p>
              <p className="text-2xl font-bold">{stats.totalSubmissions}건</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">남은 리뷰</p>
              <p className="text-2xl font-bold text-blue-700">
                {stats.totalRemaining.toLocaleString()}개
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Loader2 className={`h-5 w-5 text-amber-600 ${stats.inProgress > 0 ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-sm text-amber-600">진행 중</p>
              <p className="text-2xl font-bold text-amber-700">{stats.inProgress}건</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 거래처별 요약 */}
      {Object.keys(stats.byClient).length > 1 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byClient).map(([clientName, data]) => (
            <div
              key={clientName}
              className="px-3 py-1.5 bg-slate-100 rounded-full text-sm"
            >
              <span className="font-medium">{clientName}</span>
              <span className="text-muted-foreground ml-1">
                ({data.count}건 / {data.remaining}개)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
