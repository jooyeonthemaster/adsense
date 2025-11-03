import { requireAuth } from '@/lib/auth';
import { ReportsManagement } from './reports-management';

export default async function AdminReportsPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">리포트 관리</h1>
        <p className="text-muted-foreground">
          완료된 접수 건에 대한 리포트를 업로드하고 관리합니다
        </p>
      </div>

      <ReportsManagement />
    </div>
  );
}
