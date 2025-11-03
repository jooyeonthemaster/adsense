/**
 * ============================================================================
 * [DISABLED] 커스텀 상품 관리 기능 비활성화
 * ============================================================================
 *
 * 비활성화 날짜: 2025-11-02
 * 비활성화 이유: 클라이언트 요구사항에 따라 4가지 고정 상품만 사용
 *
 * 클라이언트 요구사항:
 * 1. 플레이스 유입 접수 (place_submissions)
 * 2. 영수증 리뷰 (receipt_review_submissions)
 * 3. 카카오맵 리뷰 (kakaomap_review_submissions)
 * 4. 블로그 배포 (blog_distribution_submissions)
 *
 * 관리자가 상품을 추가/수정/삭제하는 기능은 불필요함.
 *
 * 관련 문서: claudedocs/CUSTOM_PRODUCT_ANALYSIS.md
 * ============================================================================
 */

/*
import { requireAuth } from '@/lib/auth';
import { ProductsManagement } from './products-management';

export default async function AdminProductsPage() {
  await requireAuth(['admin']);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">상품 관리</h1>
        <p className="text-muted-foreground">
          상품 카테고리와 기본 가격을 관리합니다
        </p>
      </div>

      <ProductsManagement />
    </div>
  );
}
*/

// 임시 대체 페이지
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
