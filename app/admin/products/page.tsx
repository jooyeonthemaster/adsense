import { requireAuth } from '@/lib/auth';

export default async function AdminProductsPage() {
  await requireAuth(['admin']);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">상품 관리 기능 비활성화</h1>
        <p className="text-muted-foreground max-w-md">
          4가지 고정 상품만 사용하므로 상품 관리 기능이 비활성화되었습니다.
          <br />
          클라이언트별 단가 설정은 &quot;거래처 관리&quot;에서 가능합니다.
        </p>
      </div>
    </div>
  );
}
