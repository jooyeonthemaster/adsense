import { requireAuth } from '@/lib/auth';
import { PointsManagement } from './points-management';

export default async function AdminPointsPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">포인트 관리</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          전체 거래처의 포인트 거래 내역을 조회합니다
        </p>
      </div>

      <PointsManagement />
    </div>
  );
}
