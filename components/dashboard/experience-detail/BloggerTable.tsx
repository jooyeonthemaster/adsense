'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, ExternalLink, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { ExperienceBlogger } from './types';
import { WORKFLOW_CONFIG } from '@/types/experience-blogger';

interface BloggerTableProps {
  bloggers: ExperienceBlogger[];
  selectedBloggersCount: number;
  publishedCount: number;
  config: typeof WORKFLOW_CONFIG[string] | undefined;
}

export function BloggerTable({
  bloggers,
  selectedBloggersCount,
  publishedCount,
  config,
}: BloggerTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>블로거 목록</CardTitle>
            <CardDescription>
              {bloggers.length}명 등록
              {selectedBloggersCount > 0 && ` • ${selectedBloggersCount}명 선택됨`}
              {publishedCount > 0 && ` • ${publishedCount}명 발행완료`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bloggers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>아직 등록된 블로거가 없습니다.</p>
            <p className="text-sm">관리자가 블로거를 등록하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>블로그 지수</TableHead>
                {config?.hasSelection && <TableHead>선택 상태</TableHead>}
                <TableHead>방문 일정</TableHead>
                <TableHead>발행 상태</TableHead>
                {config?.hasKeywordRanking && <TableHead>키워드 순위</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloggers.map((blogger) => (
                <TableRow key={blogger.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{blogger.name}</span>
                      <a
                        href={blogger.blog_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      {blogger.index_score}
                    </div>
                  </TableCell>
                  {config?.hasSelection && (
                    <TableCell>
                      {blogger.selected_by_client ? (
                        <Badge variant="default" className="text-xs">
                          선택됨
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          미선택
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {blogger.visit_date && blogger.visit_time ? (
                      <div className="text-sm">
                        <p className="font-medium">
                          {new Date(blogger.visit_date).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-gray-500">
                          {blogger.visit_time} • {blogger.visit_count}명
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">미정</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {blogger.published ? (
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          발행완료
                        </Badge>
                        {blogger.published_url && (
                          <a
                            href={blogger.published_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                            리뷰 보기
                          </a>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        대기중
                      </Badge>
                    )}
                  </TableCell>
                  {config?.hasKeywordRanking && (
                    <TableCell>
                      {blogger.keyword_rankings && blogger.keyword_rankings.length > 0 ? (
                        <div className="space-y-1">
                          {blogger.keyword_rankings.map((ranking, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">{ranking.keyword}</span>
                              <span className="text-violet-600 ml-2">{ranking.rank}위</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
