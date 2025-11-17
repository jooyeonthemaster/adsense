'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircleMore, Loader2 } from 'lucide-react';

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
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircleMore className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">아직 공통 피드백이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
      </CardContent>
    </Card>
  );
}
