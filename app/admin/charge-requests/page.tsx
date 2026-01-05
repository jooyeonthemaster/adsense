import { requireAuth } from '@/lib/auth';
import { ChargeRequestsTable } from './charge-requests-table';

export default async function ChargeRequestsPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">충전 요청 관리</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          거래처의 포인트 충전 요청을 승인하거나 거부합니다
        </p>
      </div>

      <ChargeRequestsTable />
    </div>
  );
}















