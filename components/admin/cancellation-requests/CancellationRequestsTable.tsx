'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, RefreshCw, XCircle, CheckCircle, Clock } from 'lucide-react';
import { CancellationRequest, CancellationRequestStats } from '@/types/cancellation-request';
import { getSubmissionTypeLabel } from '@/lib/refund-calculator';
import { ProcessCancellationDialog } from './ProcessCancellationDialog';

const STATUS_LABELS: Record<string, string> = {
  pending: '대기중',
  approved: '승인됨',
  rejected: '거절됨',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'secondary',
  rejected: 'destructive',
};

export function CancellationRequestsTable() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [stats, setStats] = useState<CancellationRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/cancellation-requests?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setRequests(data.cancellationRequests || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching cancellation requests:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '중단 요청 목록을 불러오는데 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = (request: CancellationRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleProcessComplete = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
    fetchRequests();
  };

  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.business_name?.toLowerCase().includes(query) ||
      request.clients?.company_name?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">대기중</p>
                  <p className="text-lg font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">승인됨</p>
                  <p className="text-lg font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">거절됨</p>
                  <p className="text-lg font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div>
                <p className="text-xs text-muted-foreground">총 환불액</p>
                <p className="text-lg font-bold text-primary">{stats.total_refunded.toLocaleString()}P</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="업체명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="approved">승인됨</SelectItem>
            <SelectItem value="rejected">거절됨</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchRequests}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 테이블 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              중단 요청이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>거래처</TableHead>
                    <TableHead>업체명</TableHead>
                    <TableHead>상품</TableHead>
                    <TableHead className="text-center">진행률</TableHead>
                    <TableHead className="text-right">예상 환불</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead>요청일</TableHead>
                    <TableHead className="text-center">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request, index) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{request.clients?.company_name || '-'}</TableCell>
                      <TableCell>{request.business_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getSubmissionTypeLabel(request.submission_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{Math.round(request.progress_rate)}%</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({request.completed_count}/{request.total_count})
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {request.status === 'approved' ? (
                          <span className="text-green-600">{(request.final_refund || 0).toLocaleString()}P</span>
                        ) : (
                          <span>{request.calculated_refund.toLocaleString()}P</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={STATUS_VARIANTS[request.status]}>
                          {STATUS_LABELS[request.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        {request.status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleProcess(request)}
                          >
                            처리
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleProcess(request)}
                          >
                            상세
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 처리 다이얼로그 */}
      <ProcessCancellationDialog
        request={selectedRequest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onComplete={handleProcessComplete}
      />
    </div>
  );
}
