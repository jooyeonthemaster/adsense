import { requireAuth } from '@/lib/auth';
import { PointTransactionsTable } from './point-transactions-table';

export default async function PointsPage() {
  await requireAuth(['client']);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">포인트 거래 내역</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          포인트 충전 및 사용 내역을 확인할 수 있습니다
        </p>
      </div>

      <PointTransactionsTable />
    </div>
  );
}
