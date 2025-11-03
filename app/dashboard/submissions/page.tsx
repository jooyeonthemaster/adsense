import { requireAuth } from '@/lib/auth';
import { SubmissionsTable } from './submissions-table';

export default async function SubmissionsPage() {
  await requireAuth(['client']);

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">접수 내역</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          모든 상품의 접수 내역을 확인할 수 있습니다
        </p>
      </div>

      <SubmissionsTable />
    </div>
  );
}
