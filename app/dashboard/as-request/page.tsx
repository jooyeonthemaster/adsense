import { requireAuth } from '@/lib/auth';
import { AsRequestForm } from './as-request-form';

export default async function AsRequestPage() {
  const user = await requireAuth(['client']);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AS 신청</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          서비스 미달 20% 이상 시 AS를 신청할 수 있습니다
        </p>
      </div>

      <AsRequestForm clientId={user.id} />
    </div>
  );
}
