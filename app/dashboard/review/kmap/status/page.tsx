'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  MapPin,
  Filter,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  MessageCircleMore,
} from 'lucide-react';
import { KAKAOMAP_STATUS_LABELS } from '@/config/kakaomap-status';

interface KakaomapSubmission {
  id: string;
  company_name: string;
  kakaomap_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  script_confirmed: boolean;
  total_points: number;
  status: 'pending' | 'waiting_content' | 'review' | 'revision_requested' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  start_date?: string;

  // 콘텐츠 관련
  content_items_count?: number;

  // 원고 및 이미지
  uploaded_images?: UploadedImage[];
  uploaded_script?: string;

  // 메시지 히스토리
  messages?: Message[];
}

interface UploadedImage {
  id: string;
  url: string;
  uploaded_at: string;
  approved: boolean;
  revision_note?: string;
}

interface Message {
  id: string;
  sender: 'admin' | 'client';
  sender_name: string;
  content: string;
  created_at: string;
}

export default function KakaomapReviewStatusPage() {
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

      // 상태 필터
      if (statusFilter !== 'all') {
        filtered = filtered.filter((s: KakaomapSubmission) => s.status === statusFilter);
      }

      // 검색
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((s: KakaomapSubmission) =>
          s.company_name.toLowerCase().includes(query)
        );
      }

      // 정렬
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
      alert('동의하지 않으면 중단 요청을 할 수 없습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/submissions/kakaomap/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '중단 신청에 실패했습니다.');
      }

      const data = await response.json();
      alert(
        `중단 신청이 완료되었습니다.\n환불 금액: ${data.refund_amount?.toLocaleString()}P`
      );
      setCancelDialogOpen(false);
      setSelectedSubmission(null);
      setAgreedToCancel(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Cancel error:', error);
      alert(error instanceof Error ? error.message : '중단 신청에 실패했습니다.');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve_content' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '승인에 실패했습니다.');
      }

      alert('검수가 승인되었습니다. 리뷰 구동을 시작합니다.');
      setContentDialogOpen(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Approve error:', error);
      alert(error instanceof Error ? error.message : '승인에 실패했습니다.');
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      alert('수정 요청 사항을 입력해주세요.');
      return;
    }

    if (!currentContent) return;

    try {
      const response = await fetch(`/api/submissions/kakaomap/${currentContent.id}/revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_content: revisionNote,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '수정 요청에 실패했습니다.');
      }

      alert('수정 요청이 전송되었습니다.');
      setContentDialogOpen(false);
      setRevisionNote('');
      fetchSubmissions();
    } catch (error) {
      console.error('Revision error:', error);
      alert(error instanceof Error ? error.message : '수정 요청에 실패했습니다.');
    }
  };

  const handleOpenMessages = (submission: KakaomapSubmission) => {
    setCurrentMessages(submission.messages || []);
    setSelectedSubmission(submission);
    setNewMessage('');
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/submissions/kakaomap/${selectedSubmission.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '메시지 전송에 실패했습니다.');
      }

      const data = await response.json();

      // 메시지 추가
      const message: Message = {
        id: data.data?.id || Date.now().toString(),
        sender: 'client',
        sender_name: data.data?.sender_name || '고객',
        content: newMessage,
        created_at: data.data?.created_at || new Date().toISOString(),
      };

      setCurrentMessages([...currentMessages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
      alert(error instanceof Error ? error.message : '메시지 전송에 실패했습니다.');
    }
  };


  const calculateProgress = (submission: KakaomapSubmission): number => {
    if (submission.status === 'completed') return 100;

    // 업로드된 콘텐츠 개수 기준 진행률 계산
    const uploadedCount = submission.content_items_count || 0;
    const totalCount = submission.total_count || 1;

    return Math.min((uploadedCount / totalCount) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancel = (submission: KakaomapSubmission) =>
    ['pending', 'waiting_content', 'review', 'revision_requested', 'in_progress'].includes(submission.status);

  const stats = {
    total: submissions.length,
    in_progress: submissions.filter((s) =>
      ['pending', 'waiting_content', 'review', 'revision_requested', 'in_progress'].includes(s.status)
    ).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
    total_cost: submissions.reduce((sum, s) => sum + s.total_points, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-8 w-8" />
                <h1 className="text-2xl font-bold">카카오맵 리뷰 접수 현황</h1>
              </div>
              <p className="text-amber-100">카카오맵 리뷰 접수 내역 및 검수 상태를 관리하세요</p>
            </div>
            <Link href="/dashboard/review/kmap">
              <Button variant="secondary" size="sm">
                새 접수하기
              </Button>
            </Link>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg border bg-white shadow-sm">
            <p className="text-xs text-gray-500 mb-1">총 접수</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 shadow-sm">
            <p className="text-xs text-amber-600 mb-1">진행중</p>
            <p className="text-2xl font-bold text-amber-900">{stats.in_progress}</p>
          </div>
          <div className="p-4 rounded-lg border border-green-200 bg-green-50 shadow-sm">
            <p className="text-xs text-green-600 mb-1">완료</p>
            <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
          </div>
          <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 shadow-sm">
            <p className="text-xs text-amber-600 mb-1">총 비용</p>
            <p className="text-2xl font-bold text-amber-900">{stats.total_cost.toLocaleString()}P</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="업체명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10 text-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">{KAKAOMAP_STATUS_LABELS.pending.label}</SelectItem>
              <SelectItem value="waiting_content">{KAKAOMAP_STATUS_LABELS.waiting_content.label}</SelectItem>
              <SelectItem value="review">{KAKAOMAP_STATUS_LABELS.review.label}</SelectItem>
              <SelectItem value="revision_requested">{KAKAOMAP_STATUS_LABELS.revision_requested.label}</SelectItem>
              <SelectItem value="in_progress">{KAKAOMAP_STATUS_LABELS.in_progress.label}</SelectItem>
              <SelectItem value="completed">{KAKAOMAP_STATUS_LABELS.completed.label}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'cost')}>
            <SelectTrigger className="w-full sm:w-32 h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">접수일순</SelectItem>
              <SelectItem value="cost">비용순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        <div className="hidden md:block bg-white border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">업로드/총 건수</TableHead>
                <TableHead className="text-xs font-semibold">옵션</TableHead>
                <TableHead className="text-xs font-semibold">진행 상태</TableHead>
                <TableHead className="text-xs font-semibold">진행률</TableHead>
                <TableHead className="text-xs font-semibold">접수일</TableHead>
                <TableHead className="text-xs font-semibold text-right">비용</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-sm text-gray-500">
                    접수 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((sub) => {
                  const statusDisplay = KAKAOMAP_STATUS_LABELS[sub.status as keyof typeof KAKAOMAP_STATUS_LABELS] || { label: sub.status, variant: 'outline' as const };
                  const progress = calculateProgress(sub);

                  return (
                    <TableRow key={sub.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {sub.company_name}
                          {sub.kakaomap_url && (
                            <a
                              href={sub.kakaomap_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-amber-600">{sub.content_items_count || 0}</span>
                          <span className="text-gray-400">/</span>
                          <span>{sub.total_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sub.has_photo && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              사진
                            </Badge>
                          )}
                          {sub.script_confirmed && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              <FileText className="h-3 w-3 mr-1" />
                              원고
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusDisplay.variant} className="text-xs">
                          {statusDisplay.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.status === 'in_progress' && (
                          <div className="space-y-1">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-amber-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500">{progress.toFixed(0)}%</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(sub.created_at)}</TableCell>
                      <TableCell className="text-sm font-semibold text-right">
                        {sub.total_points.toLocaleString()}P
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {(sub.content_items_count || 0) > 0 && (
                            <Link href={`/dashboard/review/kmap/status/${sub.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-green-600 border-green-300"
                              >
                                콘텐츠 보기
                              </Button>
                            </Link>
                          )}
                          {['review', 'revision_requested'].includes(sub.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewContent(sub)}
                              className="h-7 text-xs text-amber-600 border-amber-300"
                            >
                              검수
                            </Button>
                          )}
                          {sub.status === 'in_progress' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMessages(sub)}
                              className="h-7 text-xs text-blue-600 border-blue-300"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              문의
                            </Button>
                          )}
                          {canCancel(sub) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelClick(sub)}
                              className="h-7 text-xs text-red-600 border-red-300"
                            >
                              중단
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 모바일 카드 */}
        <div className="md:hidden space-y-3">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-white border rounded-lg">
              <p className="text-sm text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            submissions.map((sub) => {
              const statusDisplay = KAKAOMAP_STATUS_LABELS[sub.status as keyof typeof KAKAOMAP_STATUS_LABELS] || { label: sub.status, variant: 'outline' as const };
              const progress = calculateProgress(sub);

              return (
                <div key={sub.id} className="bg-white border rounded-lg p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm">{sub.company_name}</h3>
                    <Badge variant={statusDisplay.variant} className="text-xs">
                      {statusDisplay.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.has_photo && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        사진 O
                      </Badge>
                    )}
                    {sub.script_confirmed && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        원고 O
                      </Badge>
                    )}
                  </div>
                  {sub.status === 'in_progress' && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">진행률: {progress.toFixed(0)}%</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">업로드/총 건수</p>
                      <p className="text-sm font-medium">
                        {sub.content_items_count || 0}건 / {sub.total_count}건
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">접수일</p>
                      <p className="text-sm font-medium">{formatDate(sub.created_at)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">비용</p>
                      <p className="text-sm font-semibold text-amber-600">
                        {sub.total_points.toLocaleString()}P
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(sub.content_items_count || 0) > 0 && (
                      <Link href={`/dashboard/review/kmap/status/${sub.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-9 text-green-600"
                        >
                          콘텐츠 보기
                        </Button>
                      </Link>
                    )}
                    {['review', 'revision_requested'].includes(sub.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewContent(sub)}
                        className="flex-1 text-xs h-9 text-amber-600"
                      >
                        검수하기
                      </Button>
                    )}
                    {sub.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenMessages(sub)}
                        className="flex-1 text-xs h-9 text-blue-600"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        1:1 문의
                      </Button>
                    )}
                    {canCancel(sub) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelClick(sub)}
                        className="flex-1 text-xs h-9 text-red-600"
                      >
                        중단 신청
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 중단 다이얼로그 */}
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
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setAgreedToCancel(false);
              }}
            >
              동의하지 않습니다
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={!agreedToCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              중단 신청
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 원고/이미지 검수 다이얼로그 */}
      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>원고 및 이미지 검수</DialogTitle>
            <DialogDescription>
              업로드된 원고와 이미지를 확인하고 검수하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* 이미지 미리보기 */}
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
                        <img
                          src={image.url}
                          alt="Review"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(image.uploaded_at)}
                        </span>
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

            {/* 원고 미리보기 */}
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

            {/* 수정 요청 메모 */}
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
            <Button variant="outline" onClick={() => setContentDialogOpen(false)}>
              닫기
            </Button>
            {currentContent?.status === 'review' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleRequestRevision}
                  className="text-amber-600 border-amber-300"
                >
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

      {/* 1:1 문의 다이얼로그 */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>1:1 문의</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.company_name} - 문의 내역
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg min-h-[300px] max-h-[400px]">
            {currentMessages.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                아직 메시지가 없습니다. 첫 메시지를 보내보세요.
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender === 'client'
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {msg.sender === 'client' ? '나' : msg.sender_name}
                      </span>
                      <span
                        className={`text-xs ${
                          msg.sender === 'client' ? 'text-amber-100' : 'text-gray-400'
                        }`}
                      >
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
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
