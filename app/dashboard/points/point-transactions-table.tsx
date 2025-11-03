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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PointTransaction {
  id: string;
  client_id: string;
  transaction_type: 'charge' | 'deduct';
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  charge: '충전',
  deduct: '차감',
};

const TRANSACTION_TYPE_VARIANTS: Record<string, 'default' | 'destructive'> = {
  charge: 'default',
  deduct: 'destructive',
};

export function PointTransactionsTable() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/points/transactions');
      if (!response.ok) {
        throw new Error('거래 내역을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
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
        <CardTitle className="text-base sm:text-lg lg:text-xl">
          전체 거래 내역 ({transactions.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        {/* 모바일: 카드 레이아웃 */}
        <div className="md:hidden space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
                <Badge variant={TRANSACTION_TYPE_VARIANTS[transaction.transaction_type]} className="text-xs shrink-0">
                  {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                </Badge>
              </div>

              <div className="space-y-2 py-2 border-y">
                <div>
                  <p className="text-xs text-muted-foreground">거래 금액</p>
                  <p className={`text-base sm:text-lg font-bold ${
                    transaction.transaction_type === 'charge' ? 'text-green-600' : 'text-destructive'
                  }`}>
                    {transaction.transaction_type === 'charge' ? '+' : ''}
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
            </div>
          ))}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-xs lg:text-sm whitespace-nowrap">
                    {formatDate(transaction.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={TRANSACTION_TYPE_VARIANTS[transaction.transaction_type]} className="text-xs">
                      {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs lg:text-sm text-muted-foreground whitespace-nowrap">
                    {transaction.description || '-'}
                  </TableCell>
                  <TableCell className={`text-right font-medium text-xs lg:text-sm whitespace-nowrap ${
                    transaction.transaction_type === 'charge' ? 'text-green-600' : 'text-destructive'
                  }`}>
                    {transaction.transaction_type === 'charge' ? '+' : ''}
                    {transaction.amount.toLocaleString()} P
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs lg:text-sm whitespace-nowrap">
                    {transaction.balance_after.toLocaleString()} P
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
