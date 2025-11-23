import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send } from 'lucide-react';
import { ContentItem, Feedback, KmapSubmission } from '@/types/review/kmap-content';
import { formatDate } from '@/utils/review/kmap-helpers';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentItem: ContentItem | null;
  submission: KmapSubmission | null;
  feedbackHistory: Feedback[];
  loading: boolean;
  onSendFeedback: (message: string) => Promise<void>;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  contentItem,
  submission,
  feedbackHistory,
  loading,
  onSendFeedback,
}: FeedbackDialogProps) {
  const [newFeedback, setNewFeedback] = useState('');

  const handleSend = async () => {
    if (!newFeedback.trim()) return;
    
    await onSendFeedback(newFeedback.trim());
    setNewFeedback('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>피드백 히스토리</DialogTitle>
          <DialogDescription>
            {contentItem && (
              <>
                콘텐츠 #{contentItem.upload_order} - {submission?.company_name}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 메시지 히스토리 영역 */}
        <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg min-h-[300px] max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
          ) : feedbackHistory.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              아직 피드백이 없습니다. 첫 메시지를 보내보세요.
            </div>
          ) : (
            feedbackHistory.map((feedback) => (
              <div
                key={feedback.id}
                className={`flex ${feedback.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    feedback.sender_type === 'client'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {feedback.sender_type === 'client' ? '나' : feedback.sender_name}
                    </span>
                    <span
                      className={`text-xs ${
                        feedback.sender_type === 'client' ? 'text-amber-100' : 'text-gray-400'
                      }`}
                    >
                      {formatDate(feedback.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 새 메시지 입력 영역 */}
        <div className="flex gap-2 pt-4">
          <Textarea
            placeholder="피드백 메시지를 입력하세요..."
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[60px] resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!newFeedback.trim()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

