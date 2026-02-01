'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, TrendingDown, RefreshCw, Wallet, Building2 } from 'lucide-react';

interface Client {
  id: string;
  company_name: string;
  points: number;
}

interface PointTransaction {
  id: string;
  client_id: string;
  transaction_type: 'charge' | 'deduct' | 'refund';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  clients?: {
    company_name: string;
    points: number;
  };
}

interface Statistics {
  totalCharge: number;
  totalDeduct: number;
  totalRefund: number;
  transactionCount: number;
  currentBalance: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  charge: '충전',
  deduct: '차감',
  refund: '환불',
};

const TYPE_VARIANTS: Record<string, 'default' | 'destructive' | 'outline'> = {
  charge: 'default',
  deduct: 'destructive',
  refund: 'outline',
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

export function PointsManagement() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 필터 상태
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, clientsRes] = await Promise.all([
        fetch('/api/admin/points/transactions'),
        fetch('/api/admin/clients'),
      ]);

      if (!transactionsRes.ok) {
        throw new Error('포인트 거래 내역을 불러오는데 실패했습니다.');
      }

      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 거래 내역
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // 거래처 필터
    if (selectedClientId !== 'all') {
      filtered = filtered.filter((t) => t.client_id === selectedClientId);
    }

    // 검색 필터 (거래처 선택 안 했을 때만)
    if (selectedClientId === 'all' && searchTerm) {
      filtered = filtered.filter((t) =>
        t.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 거래 유형 필터
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.transaction_type === typeFilter);
    }

    // 날짜 필터
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.created_at);

        switch (dateFilter) {
          case 'today':
            return transactionDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return transactionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return transactionDate >= monthAgo;
          case '3months':
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return transactionDate >= threeMonthsAgo;
          default:
            return true;
        }
      });
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

    return filtered;
  }, [selectedClientId, searchTerm, typeFilter, dateFilter, sortBy, transactions]);

  // 통계 계산
  const statistics = useMemo((): Statistics => {
    const stats = filteredTransactions.reduce(
      (acc, t) => {
        if (t.transaction_type === 'charge') {
          acc.totalCharge += t.amount;
        } else if (t.transaction_type === 'deduct') {
          acc.totalDeduct += t.amount;
        } else if (t.transaction_type === 'refund') {
          acc.totalRefund += t.amount;
        }
        return acc;
      },
      { totalCharge: 0, totalDeduct: 0, totalRefund: 0 }
    );

    // 선택된 거래처의 현재 잔액
    let currentBalance: number | null = null;
    if (selectedClientId !== 'all') {
      const client = clients.find((c) => c.id === selectedClientId);
      currentBalance = client?.points ?? null;
    }

    return {
      ...stats,
      transactionCount: filteredTransactions.length,
      currentBalance,
    };
  }, [filteredTransactions, selectedClientId, clients]);

  // 선택된 거래처 정보
  const selectedClient = useMemo(() => {
    if (selectedClientId === 'all') return null;
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [selectedClientId, clients]);

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

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return '오늘';
      case 'week': return '최근 7일';
      case 'month': return '최근 30일';
      case '3months': return '최근 3개월';
      default: return '전체 기간';
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* 거래처 선택 */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            거래처 선택
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="거래처를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 거래처</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company_name} ({formatPrice(client.points)}P)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 총 충전 */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">총 충전</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
              +{formatPrice(statistics.totalCharge)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{getDateFilterLabel()}</p>
          </CardContent>
        </Card>

        {/* 총 차감 */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">총 차감</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
              -{formatPrice(statistics.totalDeduct)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{getDateFilterLabel()}</p>
          </CardContent>
        </Card>

        {/* 총 환불 */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">총 환불</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              +{formatPrice(statistics.totalRefund)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{getDateFilterLabel()}</p>
          </CardContent>
        </Card>

        {/* 현재 잔액 (거래처 선택 시) 또는 거래 건수 */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {selectedClient ? '현재 잔액' : '거래 건수'}
              </span>
            </div>
            {selectedClient ? (
              <>
                <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatPrice(statistics.currentBalance ?? 0)}P
                </p>
                <p className="text-xs text-muted-foreground mt-1">{selectedClient.company_name}</p>
              </>
            ) : (
              <>
                <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {statistics.transactionCount}건
                </p>
                <p className="text-xs text-muted-foreground mt-1">{getDateFilterLabel()}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 테이블 */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            {selectedClient
              ? `${selectedClient.company_name} 거래 내역`
              : '전체 포인트 거래 내역'
            } ({filteredTransactions.length}건)
          </CardTitle>
          {/* 필터 영역 */}
          <div className="mt-3 sm:mt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:grid sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* 거래처 검색 (전체 선택 시만) */}
              {selectedClientId === 'all' && (
                <div className="grid gap-1.5 sm:gap-2 min-w-[180px] sm:min-w-0">
                  <Label htmlFor="search" className="text-xs sm:text-sm whitespace-nowrap">거래처 검색</Label>
                  <Input
                    id="search"
                    placeholder="거래처명..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>
              )}
              <div className="grid gap-1.5 sm:gap-2 min-w-[120px] sm:min-w-0">
                <Label htmlFor="type-filter" className="text-xs sm:text-sm whitespace-nowrap">거래 유형</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs sm:text-sm">전체</SelectItem>
                    <SelectItem value="charge" className="text-xs sm:text-sm">충전</SelectItem>
                    <SelectItem value="deduct" className="text-xs sm:text-sm">차감</SelectItem>
                    <SelectItem value="refund" className="text-xs sm:text-sm">환불</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 sm:gap-2 min-w-[120px] sm:min-w-0">
                <Label htmlFor="date-filter" className="text-xs sm:text-sm whitespace-nowrap">기간</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="date-filter" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs sm:text-sm">전체</SelectItem>
                    <SelectItem value="today" className="text-xs sm:text-sm">오늘</SelectItem>
                    <SelectItem value="week" className="text-xs sm:text-sm">최근 7일</SelectItem>
                    <SelectItem value="month" className="text-xs sm:text-sm">최근 30일</SelectItem>
                    <SelectItem value="3months" className="text-xs sm:text-sm">최근 3개월</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 sm:gap-2 min-w-[120px] sm:min-w-0">
                <Label htmlFor="sort-by" className="text-xs sm:text-sm whitespace-nowrap">정렬</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort-by" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="최신순" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc" className="text-xs sm:text-sm">최신순</SelectItem>
                    <SelectItem value="date-asc" className="text-xs sm:text-sm">오래된순</SelectItem>
                    <SelectItem value="amount-desc" className="text-xs sm:text-sm">금액 높은순</SelectItem>
                    <SelectItem value="amount-asc" className="text-xs sm:text-sm">금액 낮은순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8">
              조회된 거래 내역이 없습니다.
            </p>
          ) : (
            <>
              {/* 모바일: 카드 레이아웃 */}
              <div className="md:hidden space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {selectedClientId === 'all' && (
                          <p className="font-semibold text-sm truncate">{transaction.clients?.company_name || '-'}</p>
                        )}
                        <p className="text-xs text-muted-foreground font-mono">{formatDate(transaction.created_at)}</p>
                      </div>
                      <Badge variant={TYPE_VARIANTS[transaction.transaction_type]} className="text-xs shrink-0">
                        {TYPE_LABELS[transaction.transaction_type]}
                      </Badge>
                    </div>

                    <div className="space-y-2 py-2 border-y">
                      <div>
                        <p className="text-xs text-muted-foreground">거래 금액</p>
                        <p className={`text-base sm:text-lg font-bold ${
                          transaction.transaction_type === 'charge' ? 'text-green-600' :
                          transaction.transaction_type === 'refund' ? 'text-blue-600' :
                          'text-red-600'
                        }`}>
                          {transaction.transaction_type !== 'deduct' ? '+' : '-'}
                          {formatPrice(transaction.amount)} P
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">거래 후 잔액</p>
                        <p className="text-sm font-mono font-semibold">
                          {formatPrice(transaction.balance_after)} P
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>{transaction.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 데스크탑: 테이블 레이아웃 */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">거래 일시</TableHead>
                      {selectedClientId === 'all' && (
                        <TableHead className="text-xs lg:text-sm whitespace-nowrap">거래처</TableHead>
                      )}
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">유형</TableHead>
                      <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">금액</TableHead>
                      <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">거래 후 잔액</TableHead>
                      <TableHead className="text-xs lg:text-sm whitespace-nowrap">설명</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        {selectedClientId === 'all' && (
                          <TableCell className="font-medium text-xs lg:text-sm whitespace-nowrap">
                            {transaction.clients?.company_name || '-'}
                          </TableCell>
                        )}
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={TYPE_VARIANTS[transaction.transaction_type]} className="text-xs">
                            {TYPE_LABELS[transaction.transaction_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium text-xs lg:text-sm whitespace-nowrap ${
                          transaction.transaction_type === 'charge' ? 'text-green-600' :
                          transaction.transaction_type === 'refund' ? 'text-blue-600' :
                          'text-red-600'
                        }`}>
                          {transaction.transaction_type !== 'deduct' ? '+' : '-'}
                          {formatPrice(transaction.amount)} P
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs lg:text-sm whitespace-nowrap">
                          {formatPrice(transaction.balance_after)} P
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm text-muted-foreground whitespace-nowrap">
                          {transaction.description}
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
    </div>
  );
}
