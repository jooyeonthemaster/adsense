import { requireAuth } from '@/lib/auth';
import { AsRequestsTable } from './as-requests-table';

export default async function AdminAsRequestsPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AS 요청 관리</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          거래처의 AS 요청을 확인하고 처리합니다
        </p>
      </div>

      <AsRequestsTable />
    </div>
  );
}
