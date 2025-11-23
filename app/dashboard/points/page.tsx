import { requireAuth } from '@/lib/auth';
import { PointTransactionsTable } from './point-transactions-table';
import { PointsPageHeader } from './points-page-header';

export default async function PointsPage() {
  await requireAuth(['client']);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PointsPageHeader />
      <PointTransactionsTable />
    </div>
  );
}
