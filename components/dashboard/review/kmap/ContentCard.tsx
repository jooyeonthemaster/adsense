import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { ContentItem } from '@/types/review/kmap-content';
import { getReviewStatusInfo } from '@/utils/review/kmap-helpers';

interface ContentCardProps {
  item: ContentItem;
}

export function ContentCard({ item }: ContentCardProps) {
  const statusInfo = getReviewStatusInfo(item);

  return (
    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        {/* 상단: 순번 + 검수 상태 */}
        <div className="flex items-center justify-between">
          <Badge variant="outline">#{item.upload_order}</Badge>
          {'className' in statusInfo ? (
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          ) : (
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          )}
        </div>

        {/* 원고 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">리뷰 원고</span>
          </div>
          {item.script_text ? (
            <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
              {item.script_text}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">원고 없음</p>
          )}
        </div>

        {/* 시간 */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          {new Date(item.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
