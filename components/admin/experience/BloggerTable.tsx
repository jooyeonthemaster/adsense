import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, TrendingUp, Trash2, Loader2, Link as LinkIcon } from 'lucide-react';
import { ExperienceBlogger, WORKFLOW_CONFIG } from '@/types/experience-blogger';

interface BloggerTableProps {
  bloggers: ExperienceBlogger[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onDelete: (id: string, name: string) => void;
  onPublish: (blogger: ExperienceBlogger) => void;
  onRankings: (blogger: ExperienceBlogger) => void;
  deleteLoading: boolean;
  deletingBloggerId?: string;
  experienceType: string; // Added to determine workflow config
}

export function BloggerTable({
  bloggers,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onPublish,
  onRankings,
  deleteLoading,
  deletingBloggerId,
  experienceType,
}: BloggerTableProps) {
  const config = WORKFLOW_CONFIG[experienceType];
  const hasSelection = config?.hasSelection ?? true;
  const hasKeywordRanking = config?.hasKeywordRanking ?? true;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {hasSelection && (
            <TableHead className="w-12">
              <Checkbox
                checked={bloggers.length > 0 && selectedIds.length === bloggers.length}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
          )}
          <TableHead>이름</TableHead>
          <TableHead>블로그 지수</TableHead>
          {hasSelection && <TableHead>고객 선택</TableHead>}
          <TableHead>방문 일정</TableHead>
          <TableHead>발행 상태</TableHead>
          {hasKeywordRanking && <TableHead>키워드 순위</TableHead>}
          <TableHead>액션</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bloggers.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={hasSelection && hasKeywordRanking ? 8 : hasSelection || hasKeywordRanking ? 7 : 6}
              className="text-center py-8 text-gray-500"
            >
              등록된 블로거가 없습니다.
            </TableCell>
          </TableRow>
        ) : (
          bloggers.map((blogger) => (
            <TableRow key={blogger.id}>
              {hasSelection && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(blogger.id)}
                    onCheckedChange={() => onToggleSelect(blogger.id)}
                    disabled={blogger.published}
                  />
                </TableCell>
              )}
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
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                  {blogger.index_score}
                </div>
              </TableCell>
              {hasSelection && (
                <TableCell>
                  {blogger.selected_by_client ? (
                    <Badge variant="secondary">선택됨</Badge>
                  ) : (
                    <span className="text-gray-400">미선택</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                {blogger.visit_date ? (
                  <div className="text-sm">
                    {blogger.visit_date}
                    {blogger.visit_time && ` ${blogger.visit_time}`}
                  </div>
                ) : (
                  <span className="text-gray-400">미정</span>
                )}
              </TableCell>
              <TableCell>
                {blogger.published ? (
                  <div className="space-y-1">
                    <Badge variant="secondary">발행완료</Badge>
                    {blogger.published_url && (
                      <a
                        href={blogger.published_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-violet-600"
                      >
                        <LinkIcon className="h-3 w-3" />
                        링크
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">미발행</span>
                )}
              </TableCell>
              {hasKeywordRanking && (
                <TableCell>
                  {blogger.keyword_rankings && blogger.keyword_rankings.length > 0 ? (
                    <div className="space-y-1">
                      {blogger.keyword_rankings.map((r) => (
                        <div key={r.id} className="text-xs">
                          {r.keyword}: {r.rank}위
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">미등록</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex gap-2">
                  {(!hasSelection || blogger.selected_by_client) && !blogger.published && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPublish(blogger)}
                    >
                      발행
                    </Button>
                  )}
                  {hasKeywordRanking && blogger.published && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRankings(blogger)}
                    >
                      키워드 노출 현황
                    </Button>
                  )}
                  {!blogger.published && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(blogger.id, blogger.name)}
                      disabled={deleteLoading && deletingBloggerId === blogger.id}
                    >
                      {deleteLoading && deletingBloggerId === blogger.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

