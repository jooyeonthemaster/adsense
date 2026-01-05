'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Check, X } from 'lucide-react';

interface TaxInvoiceRequest {
  id: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'rejected';
  reject_reason: string | null;
}

interface PointTransaction {
  id: string;
  client_id: string;
  transaction_type: 'charge' | 'deduct' | 'refund';
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

// 필터 타입 정의
type FilterType = 'all' | 'charge' | 'deduct' | 'refund';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'charge', label: '충전' },
  { value: 'deduct', label: '차감' },
  { value: 'refund', label: '환불' },
];

// 거래가 환불인지 확인
const isRefund = (transaction: PointTransaction): boolean => {
  return transaction.transaction_type === 'refund';
};

// 표시용 라벨 및 스타일 결정
const getTransactionDisplay = (transaction: PointTransaction) => {
  if (isRefund(transaction)) {
    return { label: '환불', variant: 'outline' as const, color: 'text-blue-600' };
  }
  if (transaction.transaction_type === 'charge') {
    return { label: '충전', variant: 'default' as const, color: 'text-green-600' };
  }
  return { label: '차감', variant: 'destructive' as const, color: 'text-destructive' };
};

// 세금계산서 요청 상태 표시
const getTaxInvoiceStatus = (request: TaxInvoiceRequest | undefined) => {
  if (!request) return null;
  switch (request.status) {
    case 'pending':
      return { label: '요청중', variant: 'outline' as const, icon: Loader2 };
    case 'completed':
      return { label: '발행완료', variant: 'secondary' as const, icon: Check };
    case 'rejected':
      return { label: '거부됨', variant: 'destructive' as const, icon: X };
    default:
      return null;
  }
};

export function PointTransactionsTable() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [taxInvoiceRequests, setTaxInvoiceRequests] = useState<TaxInvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // 필터링된 거래 내역
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;

    return transactions.filter((transaction) => {
      switch (filter) {
        case 'charge':
          return transaction.transaction_type === 'charge';
        case 'deduct':
          return transaction.transaction_type === 'deduct';
        case 'refund':
          return transaction.transaction_type === 'refund';
        default:
          return true;
      }
    });
  }, [transactions, filter]);

  // transaction_id로 세금계산서 요청 찾기
  const getTaxInvoiceRequest = (transactionId: string) => {
    return taxInvoiceRequests.find((r) => r.transaction_id === transactionId);
  };

  const fetchData = async () => {
    try {
      const [transactionsRes, taxInvoiceRes] = await Promise.all([
        fetch('/api/points/transactions'),
        fetch('/api/client/tax-invoice-requests'),
      ]);

      if (!transactionsRes.ok) {
        throw new Error('거래 내역을 불러오는데 실패했습니다.');
      }

      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData.transactions);

      if (taxInvoiceRes.ok) {
        const taxInvoiceData = await taxInvoiceRes.json();
        setTaxInvoiceRequests(taxInvoiceData.requests || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTaxInvoice = async (transaction: PointTransaction) => {
    if (requestingId) return;

    setRequestingId(transaction.id);
    try {
      const response = await fetch('/api/client/tax-invoice-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transaction.id,
          amount: transaction.amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '세금계산서 발행 요청에 실패했습니다.');
      }

      toast({
        title: '요청 완료',
        description: '세금계산서 발행 요청이 접수되었습니다.',
      });

      // 세금계산서 요청 목록 갱신
      setTaxInvoiceRequests((prev) => [...prev, data.request]);
    } catch (err) {
      toast({
        title: '오류',
        description: err instanceof Error ? err.message : '요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setRequestingId(null);
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

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">
            거래 내역이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base sm:text-lg lg:text-xl">
            {filter === 'all' ? '전체' : FILTER_OPTIONS.find(o => o.value === filter)?.label} 거래 내역 ({filteredTransactions.length}건)
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(option.value)}
                className="text-xs sm:text-sm"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            해당 조건의 거래 내역이 없습니다.
          </div>
        ) : (
          <>
            {/* 모바일: 카드 레이아웃 */}
            <div className="md:hidden space-y-3">
              {filteredTransactions.map((transaction) => {
                const display = getTransactionDisplay(transaction);
                const taxRequest = getTaxInvoiceRequest(transaction.id);
                const taxStatus = getTaxInvoiceStatus(taxRequest);
                const isCharge = transaction.transaction_type === 'charge';

                return (
                  <div key={transaction.id} className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                      <Badge variant={display.variant} className="text-xs shrink-0">
                        {display.label}
                      </Badge>
                    </div>

                    <div className="space-y-2 py-2 border-y">
                      <div>
                        <p className="text-xs text-muted-foreground">거래 금액</p>
                        <p className={`text-base sm:text-lg font-bold ${display.color}`}>
                          {transaction.transaction_type !== 'deduct' ? '+' : ''}
                          {transaction.amount.toLocaleString()} P
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">거래 후 잔액</p>
                        <p className="text-sm font-mono font-semibold">
                          {transaction.balance_after.toLocaleString()} P
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <p>{transaction.description || '-'}</p>
                    </div>

                    {/* 세금계산서 발행 요청 버튼 (충전 거래만) */}
                    {isCharge && (
                      <div className="pt-2 border-t">
                        {taxStatus ? (
                          <div className="flex items-center gap-2">
                            <Badge variant={taxStatus.variant} className="text-xs">
                              <taxStatus.icon className="h-3 w-3 mr-1" />
                              세금계산서 {taxStatus.label}
                            </Badge>
                            {taxRequest?.reject_reason && (
                              <span className="text-xs text-destructive">
                                ({taxRequest.reject_reason})
                              </span>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => handleRequestTaxInvoice(transaction)}
                            disabled={requestingId === transaction.id}
                          >
                            {requestingId === transaction.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <FileText className="h-3 w-3 mr-1" />
                            )}
                            세금계산서 발행 요청
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 데스크탑: 테이블 레이아웃 */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">거래일시</TableHead>
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">구분</TableHead>
                    <TableHead className="text-xs lg:text-sm whitespace-nowrap">내용</TableHead>
                    <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">금액</TableHead>
                    <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">잔액</TableHead>
                    <TableHead className="text-center text-xs lg:text-sm whitespace-nowrap">세금계산서</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const display = getTransactionDisplay(transaction);
                    const taxRequest = getTaxInvoiceRequest(transaction.id);
                    const taxStatus = getTaxInvoiceStatus(taxRequest);
                    const isCharge = transaction.transaction_type === 'charge';

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={display.variant} className="text-xs">
                            {display.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs lg:text-sm text-muted-foreground whitespace-nowrap">
                          {transaction.description || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-medium text-xs lg:text-sm whitespace-nowrap ${display.color}`}>
                          {transaction.transaction_type !== 'deduct' ? '+' : ''}
                          {transaction.amount.toLocaleString()} P
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs lg:text-sm whitespace-nowrap">
                          {transaction.balance_after.toLocaleString()} P
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {isCharge ? (
                            taxStatus ? (
                              <div className="flex items-center justify-center gap-1">
                                <Badge variant={taxStatus.variant} className="text-xs">
                                  <taxStatus.icon className="h-3 w-3 mr-1" />
                                  {taxStatus.label}
                                </Badge>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleRequestTaxInvoice(transaction)}
                                disabled={requestingId === transaction.id}
                              >
                                {requestingId === transaction.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <FileText className="h-3 w-3 mr-1" />
                                )}
                                발행 요청
                              </Button>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
