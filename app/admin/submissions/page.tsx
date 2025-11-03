import { requireAuth } from '@/lib/auth';
import { AdminSubmissionsTable } from './admin-submissions-table';

export default async function AdminSubmissionsPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">전체 접수 내역</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          모든 거래처의 접수 내역을 조회하고 관리합니다
        </p>
      </div>

      <AdminSubmissionsTable />
    </div>
  );
}
