'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Send, Loader2, Edit, Check, Upload, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  upload_order: number;
  image_url?: string;
  script_text?: string;
  review_status: 'pending' | 'approved' | 'revision_requested';
}

interface Feedback {
  id: string;
  sender_type: 'admin' | 'client';
  sender_name: string;
  message: string;
  created_at: string;
}

interface FeedbackManagementProps {
  submissionId: string;
}

export function FeedbackManagement({ submissionId }: FeedbackManagementProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // 필터 및 편집 상태
  const [filterMode, setFilterMode] = useState<'all' | 'revision_requested'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editedImage, setEditedImage] = useState<File | null>(null);
  const [editedImagePreview, setEditedImagePreview] = useState<string | null>(null);
  const [editedScript, setEditedScript] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContentItems();
  }, [submissionId]);

  const fetchContentItems = async () => {
    try {
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/content`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setContentItems(data.content_items || []);
    } catch (error) {
      console.error('Error fetching content items:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '콘텐츠 목록을 불러오는데 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFeedback = async (item: ContentItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
    setLoadingFeedback(true);
    setNewMessage('');
    setIsEditing(false);
    setEditedImage(null);
    setEditedImagePreview(null);
    setEditedScript(item.script_text || '');

    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${item.id}/feedback`
      );

      if (!response.ok) throw new Error('Failed to fetch feedbacks');

      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '피드백을 불러오는데 실패했습니다.',
      });
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '파일 크기 초과',
        description: '파일 크기는 10MB를 초과할 수 없습니다.',
      });
      return;
    }

    setEditedImage(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditedImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const formData = new FormData();

      if (editedImage) {
        formData.append('image', editedImage);
      }

      if (editedScript.trim()) {
        formData.append('script_text', editedScript.trim());
      }

      const response = await fetch(
        `/api/admin/kakaomap/${submissionId}/content/${selectedItem.id}`,
        {
          method: 'PATCH',
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '수정에 실패했습니다.');
      }

      const data = await response.json();

      // 로컬 상태 업데이트
      setContentItems(prev => prev.map(item =>
        item.id === selectedItem.id
          ? { ...item, image_url: data.content_item.image_url, script_text: data.content_item.script_text }
          : item
      ));

      setSelectedItem(data.content_item);
      setIsEditing(false);
      setEditedImage(null);
      setEditedImagePreview(null);

      toast({
        title: '✓ 수정 완료',
        description: '콘텐츠가 성공적으로 수정되었습니다.',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '수정에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/kakaomap/${submissionId}/content/${selectedItem.id}/approve`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '승인에 실패했습니다.');
      }

      const data = await response.json();

      // 로컬 상태 업데이트
      setContentItems(prev => prev.map(item =>
        item.id === selectedItem.id
          ? { ...item, review_status: 'approved' }
          : item
      ));

      setSelectedItem({ ...selectedItem, review_status: 'approved' });
      setDialogOpen(false);

      toast({
        title: '✓ 승인 완료',
        description: '콘텐츠가 승인되어 유저에게 배포되었습니다.',
      });

      // 새로고침
      await fetchContentItems();
    } catch (error) {
      console.error('Error approving content:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '승인에 실패했습니다.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!newMessage.trim() || !selectedItem) return;

    setSendingFeedback(true);
    try {
      const response = await fetch(
        `/api/submissions/kakaomap/${submissionId}/content/${selectedItem.id}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: newMessage.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '피드백 전송에 실패했습니다.');
      }

      const data = await response.json();
      setFeedbacks([...feedbacks, data.feedback]);
      setNewMessage('');
      toast({
        title: '피드백 전송 완료',
        description: '피드백이 성공적으로 전송되었습니다.',
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '피드백 전송에 실패했습니다.',
      });
    } finally {
      setSendingFeedback(false);
    }
  };

  const getReviewStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '검수 대기', variant: 'outline' },
      approved: { label: '승인됨', variant: 'secondary' },
      revision_requested: { label: '수정 요청', variant: 'destructive' },
    };
    const { label, variant } = config[status] || { label: status, variant: 'outline' };
    return <Badge variant={variant}>{label}</Badge>;
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 필터링된 콘텐츠
  const filteredItems = filterMode === 'revision_requested'
    ? contentItems.filter(item => item.review_status === 'revision_requested')
    : contentItems;

  if (contentItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            아직 업로드된 콘텐츠가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>콘텐츠별 피드백 관리</CardTitle>
              <CardDescription>
                각 콘텐츠 아이템의 피드백을 확인하고 관리합니다
              </CardDescription>
            </div>

            {/* 필터 탭 */}
            <Tabs value={filterMode} onValueChange={(value) => setFilterMode(value as 'all' | 'revision_requested')}>
              <TabsList>
                <TabsTrigger value="all">
                  전체 ({contentItems.length})
                </TabsTrigger>
                <TabsTrigger value="revision_requested">
                  <Filter className="h-4 w-4 mr-1" />
                  수정 요청 ({contentItems.filter(item => item.review_status === 'revision_requested').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              수정 요청이 필요한 콘텐츠가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">콘텐츠 #{item.upload_order}</Badge>
                    {getReviewStatusBadge(item.review_status)}
                  </div>

                  {item.image_url && (
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={`콘텐츠 #${item.upload_order}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {item.script_text && (
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-sm line-clamp-3">{item.script_text}</p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenFeedback(item)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    피드백 확인 및 수정
                  </Button>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 피드백 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  콘텐츠 #{selectedItem?.upload_order} {isEditing ? '수정' : '피드백'}
                </DialogTitle>
                <DialogDescription>
                  {isEditing
                    ? '이미지와 원고를 수정할 수 있습니다'
                    : '피드백을 확인하고 콘텐츠를 수정하거나 승인할 수 있습니다'
                  }
                </DialogDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정하기
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {isEditing ? (
              /* 편집 모드 */
              <div className="space-y-4">
                {/* 이미지 업로드 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">이미지</label>
                  <div className="space-y-3">
                    {/* 현재 이미지 또는 새 이미지 미리보기 */}
                    {(editedImagePreview || selectedItem?.image_url) && (
                      <div className="aspect-video bg-muted rounded-md overflow-hidden">
                        <img
                          src={editedImagePreview || selectedItem?.image_url}
                          alt="미리보기"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* 파일 업로드 */}
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="flex-1"
                      />
                      {editedImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditedImage(null);
                            setEditedImagePreview(null);
                          }}
                        >
                          취소
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 원고 수정 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">원고</label>
                  <Textarea
                    value={editedScript}
                    onChange={(e) => setEditedScript(e.target.value)}
                    placeholder="원고를 입력하세요..."
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            ) : (
              /* 기본 모드 - 콘텐츠 표시 + 피드백 */
              <div className="space-y-4">
                {/* 현재 콘텐츠 표시 */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium">현재 콘텐츠</h3>
                  {selectedItem?.image_url && (
                    <div className="aspect-video bg-muted rounded-md overflow-hidden">
                      <img
                        src={selectedItem.image_url}
                        alt={`콘텐츠 #${selectedItem.upload_order}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {selectedItem?.script_text && (
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-sm whitespace-pre-wrap">{selectedItem.script_text}</p>
                    </div>
                  )}
                </div>

                {/* 피드백 히스토리 */}
                <div className="space-y-2">
                  <h3 className="font-medium">피드백 히스토리</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[300px] border rounded-md p-4">
                    {loadingFeedback ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : feedbacks.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">
                          아직 피드백이 없습니다.
                        </p>
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
                          {/* 발신자 이름 */}
                          <div className={`mb-1 ${
                            feedback.sender_type === 'admin' ? 'text-right' : 'text-left'
                          }`}>
                            <span className="text-sm font-medium">
                              {feedback.sender_name}
                            </span>
                          </div>

                          {/* 메시지 */}
                          <p className={`text-sm whitespace-pre-wrap mb-1 ${
                            feedback.sender_type === 'admin' ? 'text-right' : 'text-left'
                          }`}>{feedback.message}</p>

                          {/* 날짜/시간 */}
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
                </div>

                {/* 피드백 입력 */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="피드백 메시지를 입력하세요..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[80px]"
                    disabled={sendingFeedback}
                  />
                  <Button
                    onClick={handleSendFeedback}
                    disabled={!newMessage.trim() || sendingFeedback}
                    className="w-full"
                  >
                    {sendingFeedback ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        전송 중...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        피드백 보내기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* DialogFooter */}
          <DialogFooter className="flex gap-2">
            {isEditing ? (
              /* 편집 모드 버튼 */
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedImage(null);
                    setEditedImagePreview(null);
                    setEditedScript(selectedItem?.script_text || '');
                  }}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving || (!editedImage && editedScript === selectedItem?.script_text)}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      수정 저장
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* 기본 모드 버튼 */
              selectedItem?.review_status === 'revision_requested' && (
                <Button
                  onClick={handleApprove}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      승인 중...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      승인 및 배포
                    </>
                  )}
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
