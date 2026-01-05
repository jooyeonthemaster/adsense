'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Check,
  X,
  Loader2,
  ExternalLink,
  Building2,
  Phone,
  Mail,
  User,
} from 'lucide-react';

interface TaxInvoiceRequest {
  id: string;
  client_id: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  reject_reason: string | null;
  created_at: string;
  completed_at: string | null;
  clients?: {
    id: string;
    company_name: string;
    username: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    tax_email: string | null;
    business_license_url: string | null;
  };
  point_transactions?: {
    description: string | null;
    created_at: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기중',
  completed: '발행완료',
  rejected: '거부됨',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'default',
  completed: 'secondary',
  rejected: 'destructive',
};

export default function TaxInvoiceRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<TaxInvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // 다이얼로그 상태
  const [selectedRequest, setSelectedRequest] = useState<TaxInvoiceRequest | null>(null);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/admin/tax-invoice-requests?${params.toString()}`);
      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');

      const data = await response.json();
      setRequests(data.requests || []);
      setPendingCount(data.pendingCount || 0);
    } catch (error) {
      console.error('Error fetching tax invoice requests:', error);
      toast({
        title: '오류',
        description: '세금계산서 요청 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 검색 필터
  const filteredRequests = requests.filter((request) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      request.clients?.company_name?.toLowerCase().includes(term) ||
      request.clients?.username?.toLowerCase().includes(term)
    );
  });

  // 발행 완료 처리
  const handleComplete = async (request: TaxInvoiceRequest) => {
    if (processingId) return;

    setProcessingId(request.id);
    try {
      const response = await fetch('/api/admin/tax-invoice-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request.id,
          status: 'completed',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '처리에 실패했습니다.');

      toast({
        title: '발행 완료',
        description: '세금계산서 발행이 완료되었습니다.',
      });

      fetchRequests();
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  // 거부 처리
  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;

    setProcessingId(selectedRequest.id);
    try {
      const response = await fetch('/api/admin/tax-invoice-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: 'rejected',
          reject_reason: rejectReason.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '처리에 실패했습니다.');

      toast({
        title: '거부 완료',
        description: '세금계산서 발행 요청이 거부되었습니다.',
      });

      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectReason('');
      fetchRequests();
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
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
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">세금계산서 발행 요청</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            거래처의 세금계산서 발행 요청을 관리합니다
          </p>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">세금계산서 발행 요청</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          거래처의 세금계산서 발행 요청을 관리합니다
          {pendingCount > 0 && (
            <span className="ml-2 text-primary font-medium">
              (대기중: {pendingCount}건)
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            요청 목록 ({filteredRequests.length}건)
          </CardTitle>
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="text-xs sm:text-sm">검색</Label>
              <Input
                id="search"
                placeholder="거래처명, 아이디로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-full sm:w-[150px]">
              <Label htmlFor="status-filter" className="text-xs sm:text-sm">상태</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="mt-1">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="completed">발행완료</SelectItem>
                  <SelectItem value="rejected">거부됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {filteredRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              조회된 세금계산서 발행 요청이 없습니다.
            </p>
          ) : (
            <>
              {/* 모바일 카드 레이아웃 */}
              <div className="md:hidden space-y-3">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <button
                          className="text-sm font-semibold text-primary hover:underline truncate block text-left"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowClientDialog(true);
                          }}
                        >
                          {request.clients?.company_name || '-'}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          @{request.clients?.username || '-'}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[request.status]} className="text-xs">
                        {STATUS_LABELS[request.status]}
                      </Badge>
                    </div>

                    <div className="py-2 border-y space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">발행 요청 금액</p>
                        <p className="text-lg font-bold text-violet-600">
                          {request.amount.toLocaleString()} 원
                        </p>
                      </div>
                      {request.point_transactions?.description && (
                        <div>
                          <p className="text-xs text-muted-foreground">거래 내역</p>
                          <p className="text-sm">{request.point_transactions.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      요청일: {formatDate(request.created_at)}
                    </div>

                    {request.status === 'rejected' && request.reject_reason && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        거부 사유: {request.reject_reason}
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleComplete(request)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              발행 완료
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                          disabled={processingId === request.id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          거부
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 데스크탑 테이블 */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">요청일시</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">거래처</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">거래 내역</TableHead>
                      <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">금액</TableHead>
                      <TableHead className="text-center text-xs lg:text-sm whitespace-nowrap">상태</TableHead>
                      <TableHead className="text-center text-xs lg:text-sm whitespace-nowrap">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <button
                            className="text-sm font-medium text-primary hover:underline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowClientDialog(true);
                            }}
                          >
                            {request.clients?.company_name || '-'}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            @{request.clients?.username || '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm text-muted-foreground max-w-[200px] truncate">
                          {request.point_transactions?.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs lg:text-sm whitespace-nowrap">
                          {request.amount.toLocaleString()} 원
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge variant={STATUS_VARIANTS[request.status]} className="text-xs">
                            {STATUS_LABELS[request.status]}
                          </Badge>
                          {request.status === 'rejected' && request.reject_reason && (
                            <p className="text-xs text-destructive mt-1 max-w-[150px] truncate" title={request.reject_reason}>
                              {request.reject_reason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {request.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleComplete(request)}
                                disabled={processingId === request.id}
                              >
                                {processingId === request.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    발행
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectDialog(true);
                                }}
                                disabled={processingId === request.id}
                              >
                                <X className="h-3 w-3 mr-1" />
                                거부
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 거래처 상세 정보 다이얼로그 */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              거래처 정보
            </DialogTitle>
          </DialogHeader>
          {selectedRequest?.clients && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    회사명
                  </p>
                  <p className="font-medium">{selectedRequest.clients.company_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    담당자
                  </p>
                  <p className="font-medium">{selectedRequest.clients.contact_person || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    연락처
                  </p>
                  <p className="font-medium">{selectedRequest.clients.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    이메일
                  </p>
                  <p className="font-medium">{selectedRequest.clients.email || '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  세금계산서 정보
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">세금계산서 이메일</p>
                    <p className="font-medium">{selectedRequest.clients.tax_email || '-'}</p>
                  </div>
                  {selectedRequest.clients.business_license_url && (
                    <div>
                      <p className="text-muted-foreground mb-1">사업자등록증</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => window.open(selectedRequest.clients!.business_license_url!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                        사업자등록증 보기
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 거부 사유 입력 다이얼로그 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세금계산서 발행 요청 거부</DialogTitle>
            <DialogDescription>
              거부 사유를 입력해주세요. 거래처에게 거부 사유가 표시됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">거부 사유</Label>
              <Textarea
                id="reject-reason"
                placeholder="거부 사유를 입력해주세요..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || processingId === selectedRequest?.id}
            >
              {processingId === selectedRequest?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              거부 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
