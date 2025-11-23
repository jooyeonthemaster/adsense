import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  MessageCircleMore,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { ContentItem } from '@/types/review/kmap-content';
import { getReviewStatusInfo } from '@/utils/review/kmap-helpers';

interface ContentCardProps {
  item: ContentItem;
  onApprove: (item: ContentItem) => void;
  onRequestRevision: (item: ContentItem) => void;
  onOpenFeedback: (item: ContentItem) => void;
  isProcessing: boolean;
}

export function ContentCard({
  item,
  onApprove,
  onRequestRevision,
  onOpenFeedback,
  isProcessing,
}: ContentCardProps) {
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

        {/* 이미지 */}
        {item.image_url ? (
          <div className="aspect-video bg-gray-100 rounded overflow-hidden">
            <img
              src={item.image_url}
              alt={`Content ${item.upload_order}`}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs">이미지 없음</p>
            </div>
          </div>
        )}

        {/* 원고 */}
        {item.script_text && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium">리뷰 원고</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
              {item.script_text}
            </p>
          </div>
        )}

        {/* 날짜 */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          {new Date(item.created_at).toLocaleDateString('ko-KR')}
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-2 pt-2">
          {item.review_status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                onClick={() => onApprove(item)}
                disabled={isProcessing}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                검수완료
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => onRequestRevision(item)}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-1" />
                수정요청
              </Button>
            </div>
          )}

          {/* 피드백 히스토리 버튼 (항상 표시) */}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onOpenFeedback(item)}
          >
            <MessageCircleMore className="h-4 w-4 mr-1" />
            피드백 히스토리
          </Button>
        </div>
      </div>
    </div>
  );
}

