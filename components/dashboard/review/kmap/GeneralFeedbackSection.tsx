import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircleMore, Send } from 'lucide-react';
import { Feedback } from '@/types/review/kmap-content';
import { formatDate } from '@/utils/review/kmap-helpers';

interface GeneralFeedbackSectionProps {
  feedbacks: Feedback[];
  onSendFeedback: (message: string) => Promise<void>;
}

export function GeneralFeedbackSection({
  feedbacks,
  onSendFeedback,
}: GeneralFeedbackSectionProps) {
  const [newFeedback, setNewFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!newFeedback.trim()) return;
    
    setSending(true);
    try {
      await onSendFeedback(newFeedback.trim());
      setNewFeedback('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircleMore className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">전체 공통 피드백</h2>
        <Badge variant="outline" className="ml-auto">
          {feedbacks.length}개
        </Badge>
      </div>

      {/* 피드백 히스토리 */}
      <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircleMore className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">아직 공통 피드백이 없습니다</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className={`p-3 rounded-lg ${
                feedback.sender_type === 'admin'
                  ? 'bg-blue-50 ml-8'
                  : 'bg-gray-50 mr-8'
              }`}
            >
              <div className={`mb-1 ${
                feedback.sender_type === 'admin' ? 'text-right' : 'text-left'
              }`}>
                <span className="text-sm font-medium">
                  {feedback.sender_name}
                </span>
              </div>
              <p className={`text-sm whitespace-pre-wrap mb-1 ${
                feedback.sender_type === 'admin' ? 'text-right' : 'text-left'
              }`}>
                {feedback.message}
              </p>
              <div className={`${
                feedback.sender_type === 'admin' ? 'text-right' : 'text-left'
              }`}>
                <span className="text-xs text-muted-foreground">
                  {formatDate(feedback.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 새 피드백 입력 */}
      <div className="space-y-2 pt-4 border-t">
        <Textarea
          placeholder="전체 콘텐츠에 대한 공통 의견이나 요청사항을 입력하세요..."
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          className="min-h-[80px]"
          disabled={sending}
        />
        <Button
          onClick={handleSend}
          disabled={!newFeedback.trim() || sending}
          className="w-full"
        >
          {sending ? (
            <>전송 중...</>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              공통 피드백 보내기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}














