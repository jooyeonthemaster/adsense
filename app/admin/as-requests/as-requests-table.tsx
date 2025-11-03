'use client';

import { useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AsRequestStatus = 'pending' | 'approved' | 'rejected';

interface AsRequest {
  id: string;
  client_id: string;
  submission_type: string;
  submission_id: string;
  expected_count: number;
  actual_count: number;
  missing_rate: number;
  description: string;
  status: AsRequestStatus;
  admin_response: string | null;
  created_at: string;
  clients?: { company_name: string };
}

const STATUS_LABELS: Record<AsRequestStatus, string> = {
  pending: '대기중',
  approved: '승인',
  rejected: '거절',
};

const STATUS_VARIANTS: Record<
  AsRequestStatus,
  'default' | 'secondary' | 'destructive'
> = {
  pending: 'default',
  approved: 'secondary',
  rejected: 'destructive',
};

const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
};

export function AsRequestsTable() {
  const [asRequests, setAsRequests] = useState<AsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AsRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseStatus, setResponseStatus] = useState<AsRequestStatus>('approved');
  const [adminResponse, setAdminResponse] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchAsRequests();
  }, []);

  const fetchAsRequests = async () => {
    try {
      const response = await fetch('/api/as-requests');
      if (!response.ok) {
        throw new Error('AS 요청 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setAsRequests(data.asRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (request: AsRequest) => {
    setSelectedRequest(request);
    setResponseStatus(request.status === 'pending' ? 'approved' : request.status);
    setAdminResponse(request.admin_response || '');
    setDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    setResponding(true);
    setError('');

    try {
      const response = await fetch(`/api/as-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: responseStatus,
          admin_response: adminResponse,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'AS 요청 처리에 실패했습니다.');
        return;
      }

      // Success
      setDialogOpen(false);
      fetchAsRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setResponding(false);
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
            전체 AS 요청 ({asRequests.length}건)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {asRequests.length === 0 ? (
            <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8">
              AS 요청이 없습니다.
            </p>
          ) : (
            <>
              {/* 모바일: 카드 레이아웃 */}
              <div className="md:hidden space-y-3">
                {asRequests.map((request) => (
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          {SUBMISSION_TYPE_LABELS[request.submission_type]}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">예정/실제</p>
                          <p className="font-medium">
                            {request.expected_count} / {request.actual_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">미달률</p>
                          <p className="font-medium text-destructive">
                            {request.missing_rate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Button
                        size="sm"
                        onClick={() => handleRespond(request)}
                        className="w-full text-xs"
                      >
                        처리
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 데스크탑: 테이블 레이아웃 */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">요청일시</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">거래처</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">상품유형</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">예정/실제</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">미달률</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">상태</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">처리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell className="font-medium text-xs lg:text-sm whitespace-nowrap">
                          {request.clients?.company_name || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">
                            {SUBMISSION_TYPE_LABELS[request.submission_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm whitespace-nowrap">
                          {request.expected_count} / {request.actual_count}
                        </TableCell>
                        <TableCell className="font-medium text-destructive text-xs lg:text-sm whitespace-nowrap">
                          {request.missing_rate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={STATUS_VARIANTS[request.status]} className="text-xs">
                            {STATUS_LABELS[request.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Button
                            size="sm"
                            onClick={() => handleRespond(request)}
                            className="text-xs"
                          >
                            처리
                          </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AS 요청 처리</DialogTitle>
            <DialogDescription>
              AS 요청을 검토하고 승인 또는 거절하세요
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">거래처</p>
                <p className="font-medium">{selectedRequest.clients?.company_name}</p>
              </div>

              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">상품 유형</p>
                <Badge variant="outline" className="w-fit">
                  {SUBMISSION_TYPE_LABELS[selectedRequest.submission_type]}
                </Badge>
              </div>

              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">미달 내역</p>
                <p>
                  예정: {selectedRequest.expected_count} / 실제: {selectedRequest.actual_count} (미달률: {selectedRequest.missing_rate.toFixed(1)}%)
                </p>
              </div>

              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">요청 사유</p>
                <p className="text-sm">{selectedRequest.description}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="response_status">처리 상태</Label>
                <Select value={responseStatus} onValueChange={(value) => setResponseStatus(value as AsRequestStatus)}>
                  <SelectTrigger id="response_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">승인</SelectItem>
                    <SelectItem value="rejected">거절</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="admin_response">관리자 응답</Label>
                <Textarea
                  id="admin_response"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="AS 처리 내용을 입력하세요"
                  rows={5}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={responding}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmitResponse}
              disabled={responding}
            >
              {responding ? '처리 중...' : '처리 완료'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
