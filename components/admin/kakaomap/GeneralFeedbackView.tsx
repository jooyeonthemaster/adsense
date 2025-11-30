'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircleMore, Loader2, Send } from 'lucide-react';

interface Feedback {
  id: string;
  sender_type: 'admin' | 'client';
  sender_name: string;
  message: string;
  created_at: string;
}

interface GeneralFeedbackViewProps {
  submissionId: string;
}

export function GeneralFeedbackView({ submissionId }: GeneralFeedbackViewProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [submissionId]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/submissions/kakaomap/${submissionId}/feedback`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching general feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/submissions/kakaomap/${submissionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      await fetchFeedbacks(); // 목록 새로고침
    } catch (error) {
      console.error('Error sending message:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircleMore className="h-5 w-5 text-blue-600" />
          <CardTitle>전체 공통 피드백</CardTitle>
          <Badge variant="outline" className="ml-auto">
            {feedbacks.length}개
          </Badge>
        </div>
        <CardDescription>
          클라이언트가 전체 콘텐츠에 대해 남긴 공통 의견 및 요청사항
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 메시지 목록 */}
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground mb-4">
            <MessageCircleMore className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">아직 공통 피드백이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
            {feedbacks.map((feedback) => (
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
            ))}
          </div>
        )}

        {/* 관리자 답장 입력 */}
        <div className="space-y-2 pt-4 border-t">
          <Textarea
            placeholder="클라이언트에게 답장을 입력하세요..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[80px]"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                전송 중...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                답장 보내기
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
