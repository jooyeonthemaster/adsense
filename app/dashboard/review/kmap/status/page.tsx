'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Clock, ImageIcon, FileText, AlertCircle, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { KakaomapSubmission, Message } from '@/types/review/kmap-status';
import { StatusPageHeader } from '@/components/dashboard/review/kmap/StatusPageHeader';
import { StatusStatsCards } from '@/components/dashboard/review/kmap/StatusStats';
import { StatusFilters } from '@/components/dashboard/review/kmap/StatusFilters';
import { StatusTable } from '@/components/dashboard/review/kmap/StatusTable';
import { StatusMobileCard } from '@/components/dashboard/review/kmap/StatusMobileCard';
import { calculateStats, formatDate } from '@/utils/review/kmap-status-helpers';

export default function KakaomapReviewStatusPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<KakaomapSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<KakaomapSubmission | null>(null);
  const [agreedToCancel, setAgreedToCancel] = useState(false);

  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<KakaomapSubmission | null>(null);
  const [revisionNote, setRevisionNote] = useState('');

  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [asConditionDialogOpen, setAsConditionDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, searchQuery, sortBy]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/submissions/kakaomap');
      if (!response.ok) throw new Error('Failed to fetch submissions');

      const data = await response.json();
      let filtered = data.submissions || [];

      if (statusFilter !== 'all') {
        filtered = filtered.filter((s: KakaomapSubmission) => s.status === statusFilter);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((s: KakaomapSubmission) =>
          s.company_name.toLowerCase().includes(query)
        );
      }

      filtered.sort((a: KakaomapSubmission, b: KakaomapSubmission) => {
        if (sortBy === 'cost') {
          return b.total_points - a.total_points;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setSubmissions(filtered);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (submission: KakaomapSubmission) => {
    setSelectedSubmission(submission);
    setAgreedToCancel(false);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!agreedToCancel || !selectedSubmission) {
      toast({
        variant: 'destructive',
        title: '동의 필요',
        description: '동의하지 않으면 중단 요청을 할 수 없습니다.',
      });
      return;
    }

    try {
      const response = await fetch(`/api/submissions/kakaomap/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '중단 신청에 실패했습니다.');
      }

      const data = await response.json();
      toast({
        title: '✅ 중단 신청 완료',
        description: `환불 금액: ${data.refund_amount?.toLocaleString()}P`,
        duration: 5000,
      });
      setCancelDialogOpen(false);
      setSelectedSubmission(null);
      setAgreedToCancel(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        variant: 'destructive',
        title: '중단 신청 실패',
        description: error instanceof Error ? error.message : '중단 신청에 실패했습니다.',
      });
    }
  };

  const handleViewContent = (submission: KakaomapSubmission) => {
    setCurrentContent(submission);
    setRevisionNote('');
    setContentDialogOpen(true);
  };

  const handleApproveContent = async () => {
    if (!currentContent) return;

    try {
      const response = await fetch(`/api/submissions/kakaomap/${currentContent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_content' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '승인에 실패했습니다.');
      }

      toast({
        title: '✅ 검수 승인 완료',
        description: '리뷰 구동을 시작합니다.',
        duration: 5000,
      });
      setContentDialogOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Approve error:', error);
      toast({
        variant: 'destructive',
        title: '승인 실패',
        description: error instanceof Error ? error.message : '승인에 실패했습니다.',
      });
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '수정 요청 사항을 입력해주세요.',
      });
      return;
    }

    if (!currentContent) return;

    try {
      const response = await fetch(`/api/submissions/kakaomap/${currentContent.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_content: revisionNote }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '수정 요청에 실패했습니다.');
      }

      toast({
        title: '✅ 수정 요청 완료',
        description: '수정 요청이 전송되었습니다.',
        duration: 5000,
      });
      setContentDialogOpen(false);
      setRevisionNote('');
      fetchSubmissions();
    } catch (error) {
      console.error('Revision error:', error);
      toast({
        variant: 'destructive',
        title: '수정 요청 실패',
        description: error instanceof Error ? error.message : '수정 요청에 실패했습니다.',
      });
    }
  };

  const handleOpenMessages = async (submission: KakaomapSubmission) => {
    setSelectedSubmission(submission);
    setNewMessage('');
    setCurrentMessages([]);
    setMessageDialogOpen(true);

    // API에서 메시지 fetch
    try {
      const response = await fetch(`/api/submissions/kakaomap/${submission.id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setCurrentMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/submissions/kakaomap/${selectedSubmission.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '메시지 전송에 실패했습니다.');
      }

      const data = await response.json();

      const message: Message = {
        id: data.data?.id || Date.now().toString(),
        sender_type: 'client',
        sender_id: data.data?.sender_id || '',
        sender_name: data.data?.sender_name || '고객',
        content: newMessage,
        created_at: data.data?.created_at || new Date().toISOString(),
      };

      setCurrentMessages([...currentMessages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        variant: 'destructive',
        title: '메시지 전송 실패',
        description: error instanceof Error ? error.message : '메시지 전송에 실패했습니다.',
      });
    }
  };

  const stats = calculateStats(submissions);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-3 lg:p-6">
      <div className="space-y-3 sm:space-y-4">
        <StatusPageHeader />
        <StatusStatsCards stats={stats} />
        <StatusFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          sortBy={sortBy}
          onSearchChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onSortByChange={(v) => setSortBy(v as 'date' | 'cost')}
        />
        <StatusTable
          submissions={submissions}
          onViewContent={handleViewContent}
          onOpenMessages={handleOpenMessages}
          onCancelClick={handleCancelClick}
          onAsConditionClick={() => setAsConditionDialogOpen(true)}
        />

        {/* 모바일 카드 */}
        <div className="md:hidden space-y-2">
          {submissions.length === 0 ? (
            <div className="text-center py-8 bg-white border rounded-lg">
              <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <StatusMobileCard
                key={sub.id}
                submission={sub}
                onViewContent={handleViewContent}
                onOpenMessages={handleOpenMessages}
                onCancelClick={handleCancelClick}
                onAsConditionClick={() => setAsConditionDialogOpen(true)}
              />
            ))
          )}
        </div>
      </div>

      {/* Dialogs */}
      {/* AS 조건 안내 모달 */}
      <Dialog open={asConditionDialogOpen} onOpenChange={setAsConditionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              AS 신청 조건 안내
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                <p className="text-sm text-gray-700">작업이 <span className="font-semibold text-gray-900">완료된 상태</span>여야 합니다.</p>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                <p className="text-sm text-gray-700">예정 수량 대비 실제 달성 수량이 <span className="font-semibold text-gray-900">20% 이상 부족</span>해야 합니다.</p>
              </div>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600 font-medium">현재 작업이 아직 완료되지 않았습니다.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAsConditionDialogOpen(false)} className="w-full sm:w-auto">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>작업 중단 확인</DialogTitle>
            <DialogDescription>
              이미 구동된 리뷰 수량 제외 남은 건에 대해 환불이 진행됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agree"
                checked={agreedToCancel}
                onCheckedChange={(checked) => setAgreedToCancel(checked === true)}
              />
              <label htmlFor="agree" className="text-sm font-medium">
                동의합니다
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelDialogOpen(false); setAgreedToCancel(false); }}>
              동의하지 않습니다
            </Button>
            <Button onClick={handleConfirmCancel} disabled={!agreedToCancel} className="bg-red-600 hover:bg-red-700 text-white">
              중단 신청
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>원고 및 이미지 검수</DialogTitle>
            <DialogDescription>업로드된 원고와 이미지를 확인하고 검수하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {currentContent?.uploaded_images && currentContent.uploaded_images.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  업로드된 이미지 ({currentContent.uploaded_images.length}장)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {currentContent.uploaded_images.map((image) => (
                    <div key={image.id} className="border rounded-lg p-2 space-y-2">
                      <div className="aspect-square bg-gray-100 rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt="Review" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{formatDate(image.uploaded_at)}</span>
                        {image.approved ? (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            승인됨
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600">
                            <Clock className="h-3 w-3 mr-1" />
                            대기중
                          </Badge>
                        )}
                      </div>
                      {image.revision_note && (
                        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          수정 요청: {image.revision_note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentContent?.uploaded_script && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  리뷰 원고
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">{currentContent.uploaded_script}</p>
                </div>
              </div>
            )}

            {currentContent?.status === 'review' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  수정 요청 사항 (선택)
                </h3>
                <Textarea
                  placeholder="수정이 필요한 부분을 구체적으로 작성해주세요..."
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className="min-h-24"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setContentDialogOpen(false)}>닫기</Button>
            {currentContent?.status === 'review' && (
              <>
                <Button variant="outline" onClick={handleRequestRevision} className="text-amber-600 border-amber-300">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  수정 요청
                </Button>
                <Button onClick={handleApproveContent} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  검수 승인
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>1:1 문의</DialogTitle>
            <DialogDescription>{selectedSubmission?.company_name} - 문의 내역</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg min-h-[300px] max-h-[400px]">
            {currentMessages.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                아직 메시지가 없습니다. 첫 메시지를 보내보세요.
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_type === 'client' ? 'bg-amber-500 text-white' : 'bg-white border shadow-sm'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{msg.sender_type === 'client' ? '나' : msg.sender_name}</span>
                      <span className={`text-xs ${msg.sender_type === 'client' ? 'text-amber-100' : 'text-gray-400'}`}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <Textarea
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[60px] resize-none"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="bg-amber-600 hover:bg-amber-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
