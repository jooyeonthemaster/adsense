'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Check, X } from 'lucide-react';

interface ChargeRequest {
  id: string;
  client_id: string;
  amount: number;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  clients?: {
    id: string;
    username: string;
    company_name: string;
    contact_person: string | null;
    phone: string | null;
    points: number;
  };
  admins?: {
    id: string;
    name: string;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기중',
  approved: '승인됨',
  rejected: '거부됨',
};

const STATUS_VARIANTS: Record<string, 'default' | 'destructive' | 'secondary'> = {
  pending: 'default',
  approved: 'secondary',
  rejected: 'destructive',
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

export function ChargeRequestsTable() {
  const router = useRouter();
  const [chargeRequests, setChargeRequests] = useState<ChargeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ChargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // 거부 다이얼로그
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ChargeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchChargeRequests();
  }, []);

  useEffect(() => {
    let filtered = [...chargeRequests];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter((r) =>
        r.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'amount-asc':
          return a.amount - b.amount;
        case 'amount-desc':
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, sortBy, chargeRequests]);

  const fetchChargeRequests = async () => {
    try {
      const response = await fetch('/api/admin/charge-requests');
      if (!response.ok) {
        throw new Error('충전 요청 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setChargeRequests(data.chargeRequests);
      setFilteredRequests(data.chargeRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('이 충전 요청을 승인하시겠습니까?')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/charge-requests/${requestId}/approve`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || '충전 요청 승인에 실패했습니다.');
        return;
      }

      alert('충전 요청이 승인되었습니다.');
      router.refresh();
      fetchChargeRequests();
    } catch (err) {
      alert('충전 요청 승인 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/charge-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || '충전 요청 거부에 실패했습니다.');
        return;
      }

      alert('충전 요청이 거부되었습니다.');
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      router.refresh();
      fetchChargeRequests();
    } catch (err) {
      alert('충전 요청 거부 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
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
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            충전 요청 목록 ({filteredRequests.length} / {chargeRequests.length}건)
          </CardTitle>
          {/* 필터 영역 */}
          <div className="mt-3 sm:mt-4 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="search" className="text-xs sm:text-sm">
                거래처 검색
              </Label>
              <Input
                id="search"
                placeholder="거래처명..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="status-filter" className="text-xs sm:text-sm">
                상태
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">
                    전체
                  </SelectItem>
                  <SelectItem value="pending" className="text-xs sm:text-sm">
                    대기중
                  </SelectItem>
                  <SelectItem value="approved" className="text-xs sm:text-sm">
                    승인됨
                  </SelectItem>
                  <SelectItem value="rejected" className="text-xs sm:text-sm">
                    거부됨
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="sort-by" className="text-xs sm:text-sm">
                정렬
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by" className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="최신순" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc" className="text-xs sm:text-sm">
                    최신순
                  </SelectItem>
                  <SelectItem value="date-asc" className="text-xs sm:text-sm">
                    오래된순
                  </SelectItem>
                  <SelectItem value="amount-desc" className="text-xs sm:text-sm">
                    금액 높은순
                  </SelectItem>
                  <SelectItem value="amount-asc" className="text-xs sm:text-sm">
                    금액 낮은순
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {filteredRequests.length === 0 ? (
            <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8">
              조회된 충전 요청이 없습니다.
            </p>
          ) : (
            <>
              {/* 모바일: 카드 레이아웃 */}
              <div className="md:hidden space-y-3">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {request.clients?.company_name || '-'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[request.status]} className="text-xs shrink-0">
                        {STATUS_LABELS[request.status]}
                      </Badge>
                    </div>

                    <div className="space-y-2 py-2 border-y">
                      <div>
                        <p className="text-xs text-muted-foreground">요청 금액</p>
                        <p className="text-base sm:text-lg font-bold text-primary">
                          {formatPrice(request.amount)} 원
                        </p>
                      </div>
                      {request.description && (
                        <div>
                          <p className="text-xs text-muted-foreground">요청 사유</p>
                          <p className="text-xs">{request.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">현재 포인트</p>
                        <p className="text-sm font-semibold">
                          {formatPrice(request.clients?.points || 0)} P
                        </p>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading}
                          className="flex-1 h-8 text-xs"
                          variant="default"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          승인
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setRejectDialogOpen(true);
                          }}
                          disabled={actionLoading}
                          className="flex-1 h-8 text-xs"
                          variant="destructive"
                        >
                          <X className="h-3 w-3 mr-1" />
                          거부
                        </Button>
                      </div>
                    )}

                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        <p className="font-semibold mb-1">거부 사유:</p>
                        <p>{request.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 데스크탑: 테이블 레이아웃 */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">
                        요청일시
                      </TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">
                        거래처
                      </TableHead>
                      <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">
                        요청 금액
                      </TableHead>
                      <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">
                        현재 포인트
                      </TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">
                        상태
                      </TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">
                        요청 사유
                      </TableHead>
                      <TableHead className="text-center text-xs lg:text-sm whitespace-nowrap">
                        작업
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell className="font-medium text-xs lg:text-sm whitespace-nowrap">
                          {request.clients?.company_name || '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs lg:text-sm whitespace-nowrap text-primary">
                          {formatPrice(request.amount)} 원
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs lg:text-sm whitespace-nowrap">
                          {formatPrice(request.clients?.points || 0)} P
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={STATUS_VARIANTS[request.status]} className="text-xs">
                            {STATUS_LABELS[request.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm max-w-xs truncate">
                          {request.status === 'rejected' && request.rejection_reason ? (
                            <span className="text-destructive">거부: {request.rejection_reason}</span>
                          ) : (
                            request.description || '-'
                          )}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {request.status === 'pending' ? (
                            <div className="flex justify-center gap-2">
                              <Button
                                onClick={() => handleApprove(request.id)}
                                disabled={actionLoading}
                                size="sm"
                                className="h-7 px-2 text-xs"
                                variant="default"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                승인
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setRejectDialogOpen(true);
                                }}
                                disabled={actionLoading}
                                size="sm"
                                className="h-7 px-2 text-xs"
                                variant="destructive"
                              >
                                <X className="h-3 w-3 mr-1" />
                                거부
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {request.reviewed_at
                                ? formatDate(request.reviewed_at)
                                : '-'}
                            </span>
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

      {/* 거부 다이얼로그 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>충전 요청 거부</DialogTitle>
            <DialogDescription>
              충전 요청을 거부하는 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason">거부 사유</Label>
              <Textarea
                id="rejection-reason"
                placeholder="거부 사유를 입력하세요"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedRequest(null);
                setRejectionReason('');
              }}
              disabled={actionLoading}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={actionLoading}
            >
              {actionLoading ? '처리 중...' : '거부'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}





