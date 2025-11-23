import { ContentItem } from '@/types/review/kmap-content';
import { ContentCard } from './ContentCard';

interface ContentGridProps {
  items: ContentItem[];
  onApprove: (item: ContentItem) => void;
  onRequestRevision: (item: ContentItem) => void;
  onOpenFeedback: (item: ContentItem) => void;
  isProcessing: boolean;
}

export function ContentGrid({
  items,
  onApprove,
  onRequestRevision,
  onOpenFeedback,
  isProcessing,
}: ContentGridProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center text-gray-500 shadow-sm">
        해당 상태의 콘텐츠가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          onApprove={onApprove}
          onRequestRevision={onRequestRevision}
          onOpenFeedback={onOpenFeedback}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
}

