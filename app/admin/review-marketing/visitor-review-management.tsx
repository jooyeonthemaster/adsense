'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Search, ExternalLink, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';

interface ReceiptReviewSubmission {
  id: string;
  client_id: string;
  company_name: string;
  place_url: string;
  daily_count: number;
  total_count: number;
  has_photo: boolean;
  has_script: boolean;
  guide_text: string | null;
  total_points: number;
  status: string;
  created_at: string;
  actual_count_total?: number;
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
  };
}

const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '확인중', variant: 'outline' },
  approved: { label: '구동중', variant: 'default' }, // Legacy - will be migrated to in_progress
  in_progress: { label: '구동중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
};

export function VisitorReviewManagement() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<ReceiptReviewSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'list' | 'client'>('list');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/review-marketing/visitor');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching visitor reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = (sub: ReceiptReviewSubmission) => {
    if (sub.total_count === 0) return 0;
    const actualCount = sub.actual_count_total || 0;
    return Math.round((actualCount / sub.total_count) * 100);
  };

  // Calculate deadline
  const getDeadline = (sub: ReceiptReviewSubmission) => {
    const startDate = new Date(sub.created_at);
    const estimatedDays = Math.ceil(sub.total_count / sub.daily_count);
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + estimatedDays);
    return deadline.toLocaleDateString('ko-KR');
  };

  // Handle status change
  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/review-marketing/visitor/${submissionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh submissions list
      await fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // Apply filters
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Group by client
  const groupedData = () => {
    if (groupBy === 'list') return null;

    const groups = new Map<string, ReceiptReviewSubmission[]>();
    filteredSubmissions.forEach((sub) => {
      const key = sub.clients?.company_name || '거래처 없음';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(sub);
    });

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
      totalCost: items.reduce((sum, item) => sum + item.total_points, 0),
      count: items.length,
      inProgress: items.filter(i => ['pending', 'approved'].includes(i.status)).length,
      completed: items.filter(i => i.status === 'completed').length,
    }));
  };

  const stats = {
    total: submissions.length,
    in_progress: submissions.filter((s) => ['pending', 'approved'].includes(s.status)).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
    total_cost: submissions.reduce((sum, s) => sum + s.total_points, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const grouped = groupedData();

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 캠페인</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              진행중 {stats.in_progress}개 · 완료 {stats.completed}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>진행중</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.in_progress}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">현재 진행 중인 캠페인</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>완료</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.completed}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">완료된 캠페인</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 비용</CardDescription>
            <CardTitle className="text-3xl">{stats.total_cost.toLocaleString()}P</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">누적 포인트</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="상품명 또는 거래처로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="pending">확인중</SelectItem>
                <SelectItem value="approved">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">중단됨</SelectItem>
              </SelectContent>
            </Select>

            {/* Group By */}
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'list' | 'client')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="보기 방식" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">리스트</SelectItem>
                <SelectItem value="client">거래처별</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {grouped ? (
            // Grouped View
            <div className="space-y-4">
              {grouped.map((group) => (
                <Card key={group.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>
                          {group.count}개 캠페인 · {group.totalCost.toLocaleString()}P
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default">{group.inProgress}개 진행중</Badge>
                        <Badge variant="secondary">{group.completed}개 완료</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>업체명</TableHead>
                            <TableHead className="text-center">수량</TableHead>
                            <TableHead className="text-center">옵션</TableHead>
                            <TableHead className="text-center">상태</TableHead>
                            <TableHead className="text-center">진행률</TableHead>
                            <TableHead className="text-center">마감일</TableHead>
                            <TableHead className="text-right">비용</TableHead>
                            <TableHead className="text-center">등록일</TableHead>
                            <TableHead className="text-center">관리</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.items.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">{sub.company_name}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-medium">{sub.total_count}건</span>
                                  <span className="text-xs text-muted-foreground">
                                    {sub.daily_count}건/일
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {sub.has_photo && (
                                    <Badge variant="outline" className="text-xs">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      사진
                                    </Badge>
                                  )}
                                  {sub.has_script && (
                                    <Badge variant="outline" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      원고
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Badge
                                      variant={statusConfig[sub.status]?.variant || 'outline'}
                                      className="cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      {statusConfig[sub.status]?.label || sub.status}
                                    </Badge>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'pending')}>
                                      확인중
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'in_progress')}>
                                      구동중
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'completed')}>
                                      완료
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'cancelled')}>
                                      중단됨
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-16 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-blue-600 rounded-full h-2 transition-all"
                                      style={{ width: `${getProgressPercentage(sub)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-blue-600">
                                    {getProgressPercentage(sub)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {getDeadline(sub)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {sub.total_points.toLocaleString()}P
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button asChild size="sm" variant="outline">
                                  <Link href={`/admin/review-marketing/visitor/${sub.id}`}>
                                    관리
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // List View
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>거래처</TableHead>
                    <TableHead>업체명</TableHead>
                    <TableHead className="text-center">수량</TableHead>
                    <TableHead className="text-center">옵션</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-center">진행률</TableHead>
                    <TableHead className="text-center">마감일</TableHead>
                    <TableHead className="text-right">비용</TableHead>
                    <TableHead className="text-center">등록일</TableHead>
                    <TableHead className="text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {searchQuery || statusFilter !== 'all'
                          ? '검색 결과가 없습니다.'
                          : '방문자 리뷰 접수 내역이 없습니다.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium">{sub.clients?.company_name || '-'}</div>
                            {sub.clients?.contact_person && (
                              <div className="text-xs text-muted-foreground">
                                {sub.clients.contact_person}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{sub.company_name}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">{sub.total_count}건</span>
                            <span className="text-xs text-muted-foreground">
                              {sub.daily_count}건/일
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {sub.has_photo && (
                              <Badge variant="outline" className="text-xs">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                사진
                              </Badge>
                            )}
                            {sub.has_script && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                원고
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Badge
                                variant={statusConfig[sub.status]?.variant || 'outline'}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {statusConfig[sub.status]?.label || sub.status}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'pending')}>
                                확인중
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'in_progress')}>
                                구동중
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'completed')}>
                                완료
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(sub.id, 'cancelled')}>
                                중단됨
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-blue-600 rounded-full h-2 transition-all"
                                style={{ width: `${getProgressPercentage(sub)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-blue-600">
                              {getProgressPercentage(sub)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {getDeadline(sub)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {sub.total_points.toLocaleString()}P
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/review-marketing/visitor/${sub.id}`}>
                              관리
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredSubmissions.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              총 {filteredSubmissions.length}개의 캠페인 · 총 비용{' '}
              {filteredSubmissions.reduce((sum, s) => sum + s.total_points, 0).toLocaleString()}P
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
