'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit } from 'lucide-react';
import type { ContentItem } from './types';

interface ContentCardProps {
  item: ContentItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (item: ContentItem) => void;
}

const REVIEW_STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: '검수 대기', variant: 'outline' },
  approved: { label: '배포됨', variant: 'secondary' },
  revision_requested: { label: '수정 요청', variant: 'destructive' },
};

export function ContentCard({ item, isSelected, onToggleSelect, onEdit }: ContentCardProps) {
  const statusConfig = REVIEW_STATUS_CONFIG[item.review_status] || {
    label: item.review_status,
    variant: 'outline' as const,
  };

  return (
    <Card
      className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.review_status === 'pending' && (
              <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(item.id)} />
            )}
            <Badge variant="outline">#{item.upload_order}</Badge>
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>

        {item.script_text && (
          <div className="bg-muted rounded-md p-3">
            <p className="text-sm line-clamp-3 whitespace-pre-wrap">{item.script_text}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {new Date(item.created_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
            <Edit className="h-4 w-4 mr-1" />
            수정
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
