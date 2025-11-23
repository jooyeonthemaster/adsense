import { requireAuth } from '@/lib/auth';
import { AdminSubmissionsTable } from './admin-submissions-table';

export default async function AdminSubmissionsPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">전체 접수 내역</h1>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          모든 거래처의 접수 내역을 조회하고 관리합니다
        </p>
      </div>

      <AdminSubmissionsTable />
    </div>
  );
}
