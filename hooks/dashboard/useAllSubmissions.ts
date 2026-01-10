import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { UnifiedSubmission, AllSubmissionsStats, SubmissionStatus } from '@/types/submission';
import { productConfig, categoryProducts } from '@/config/submission-products';
import { calculateProgress, getProductInfo } from '@/lib/submission-utils';
import { getMockSubmissions, calculateMockStats } from '@/app/dashboard/submissions/mockData';
import * as XLSX from 'xlsx';

export function useAllSubmissions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<UnifiedSubmission[]>([]);
  const [stats, setStats] = useState<AllSubmissionsStats | null>(null);
  const [loading, setLoading] = useState(true);

  // URL 쿼리 파라미터에서 초기값 읽기
  const initialCategory = searchParams.get('category') || 'all';
  const initialProduct = searchParams.get('product') || 'all';

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [productFilter, setProductFilter] = useState<string>(initialProduct);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'progress'>('date');

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<UnifiedSubmission | null>(null);

  // Download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // AS condition dialog
  const [asConditionDialogOpen, setAsConditionDialogOpen] = useState(false);

  // URL 쿼리 파라미터 변경 감지
  useEffect(() => {
    const category = searchParams.get('category') || 'all';
    const product = searchParams.get('product') || 'all';

    if (category !== selectedCategory) {
      setSelectedCategory(category);
    }
    if (product !== productFilter) {
      setProductFilter(product);
    }
  }, [searchParams, selectedCategory, productFilter]);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, productFilter, statusFilter, searchQuery, sortBy]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);

    let newProduct = 'all';
    if (category === 'all') {
      newProduct = 'all';
    } else {
      const products = categoryProducts[category];
      if (products.length === 1) {
        newProduct = products[0];
      } else {
        newProduct = 'category-all';
      }
    }
    setProductFilter(newProduct);

    // URL 쿼리 파라미터 업데이트
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', category);
    params.set('product', newProduct);
    router.push(`/dashboard/submissions?${params.toString()}`, { scroll: false });
  };

  const handleProductSelect = (product: string) => {
    setProductFilter(product);

    // URL 쿼리 파라미터 업데이트
    const params = new URLSearchParams(searchParams.toString());
    params.set('product', product);
    router.push(`/dashboard/submissions?${params.toString()}`, { scroll: false });
  };

  const getActiveProducts = (): string[] => {
    if (selectedCategory === 'all') return [];
    if (productFilter !== 'all' && productFilter !== 'category-all') {
      return [productFilter];
    }
    return categoryProducts[selectedCategory] || [];
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (productFilter !== 'all' && productFilter !== 'category-all') {
        const config = productConfig[productFilter as keyof typeof productConfig];
        if (config) {
          params.append('product_type', config.productType);
        }
      }

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort_by', sortBy);

      const response = await fetch(`/api/submissions/all?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');

      const data = await response.json();

      let filteredSubmissions = data.submissions;
      const activeProducts = getActiveProducts();

      if (activeProducts.length > 0) {
        filteredSubmissions = filteredSubmissions.filter((s: UnifiedSubmission) => {
          for (const [key, config] of Object.entries(productConfig)) {
            if (config.productType === s.product_type) {
              const configAny = config as any;
              // place(리워드)의 경우 mediaType으로 투플/유레카 구분
              if (config.productType === 'place' && configAny.mediaType) {
                if (s.media_type === configAny.mediaType) {
                  return activeProducts.includes(key);
                }
              } else if (configAny.subType) {
                if (config.productType === 'blog' && s.distribution_type === configAny.subType) {
                  return activeProducts.includes(key);
                } else if (config.productType === 'experience' && s.experience_type === configAny.subType) {
                  return activeProducts.includes(key);
                } else if (config.productType === 'cafe' && s.service_type === configAny.subType) {
                  return activeProducts.includes(key);
                }
              } else {
                // place는 항상 mediaType으로 구분하므로 generic 'place' config는 스킵
                if (config.productType === 'place') continue;
                return activeProducts.includes(key);
              }
            }
          }
          return false;
        });
      }

      setSubmissions(filteredSubmissions);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching submissions:', error);

      // Use mock data
      const mockSubmissions = getMockSubmissions();
      let filtered = mockSubmissions;

      // Apply filters
      const activeProducts = getActiveProducts();
      if (activeProducts.length > 0) {
        filtered = filtered.filter((s) => {
          for (const [key, config] of Object.entries(productConfig)) {
            if (config.productType === s.product_type) {
              const configAny = config as any;
              // place(리워드)의 경우 mediaType으로 투플/유레카 구분
              if (config.productType === 'place' && configAny.mediaType) {
                if (s.media_type === configAny.mediaType) {
                  return activeProducts.includes(key);
                }
              } else if (configAny.subType) {
                if (config.productType === 'blog' && s.distribution_type === configAny.subType) {
                  return activeProducts.includes(key);
                } else if (config.productType === 'experience' && s.experience_type === configAny.subType) {
                  return activeProducts.includes(key);
                } else if (config.productType === 'cafe' && s.service_type === configAny.subType) {
                  return activeProducts.includes(key);
                }
              } else {
                // place는 항상 mediaType으로 구분하므로 generic 'place' config는 스킵
                if (config.productType === 'place') continue;
                return activeProducts.includes(key);
              }
            }
          }
          return false;
        });
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.company_name.toLowerCase().includes(query) || s.place_mid?.includes(query)
        );
      }

      // Sort
      filtered.sort((a, b) => {
        if (sortBy === 'cost') {
          return b.total_points - a.total_points;
        } else if (sortBy === 'progress') {
          return calculateProgress(b) - calculateProgress(a);
        } else {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      setSubmissions(filtered);
      setStats(calculateMockStats(mockSubmissions));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (submission: UnifiedSubmission) => {
    setSelectedSubmission(submission);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async (reason?: string) => {
    if (!selectedSubmission) return;

    try {
      // 중단 요청 API 호출 (요청 기반 시스템)
      const response = await fetch('/api/cancellation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_type: selectedSubmission.product_type,
          submission_id: selectedSubmission.id,
          reason: reason || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '중단 요청 중 오류가 발생했습니다.');
      }

      const refundPreview = data.refundDetails?.calculatedRefund || 0;

      toast({
        title: '중단 요청 접수 완료',
        description: `관리자 검토 후 처리됩니다. 예상 환불액: ${refundPreview.toLocaleString()}P`,
      });

      setCancelDialogOpen(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Cancel request error:', error);
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: error instanceof Error ? error.message : '중단 요청에 실패했습니다.',
      });
      throw error; // 다이얼로그에서 처리하도록 에러 전파
    }
  };

  // 리포트 다운로드 핸들러
  const handleDownloadReport = async (submission: UnifiedSubmission) => {
    setDownloadingId(submission.id);
    try {
      // 상품 타입에 따라 적절한 API 엔드포인트 결정
      const apiEndpoints: Record<string, string> = {
        place: `/api/submissions/reward/${submission.id}/content`,
        receipt: `/api/submissions/receipt/${submission.id}/content`,
        kakaomap: `/api/submissions/kakaomap/${submission.id}/content`,
        blog: `/api/submissions/blog/${submission.id}/content`,
        cafe: `/api/submissions/cafe/${submission.id}`,
      };

      const endpoint = apiEndpoints[submission.product_type];
      if (!endpoint) {
        throw new Error('지원되지 않는 상품 유형입니다.');
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('데이터를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      const contentItems = data.items || data.content_items || [];

      if (contentItems.length === 0) {
        toast({
          variant: 'destructive',
          title: '다운로드 불가',
          description: '리포트 다운로드 기능은 관리자가 리포트를 등록한 후 사용 가능합니다.',
        });
        return;
      }

      // 상품 타입별 엑셀 데이터 포맷팅
      const productInfo = getProductInfo(submission);
      let excelData: any[] = [];
      let sheetName = '리포트';

      const statusLabels: Record<string, string> = {
        approved: '승인됨',
        revision_requested: '수정요청',
        pending: '대기',
      };

      switch (submission.product_type) {
        case 'blog':
          sheetName = submission.distribution_type === 'reviewer' ? '리뷰어배포' :
                     submission.distribution_type === 'video' ? '영상배포' : '자동화배포';
          excelData = contentItems.map((item: any) => ({
            '접수번호': submission.submission_number || '',
            '업체명': submission.company_name || '',
            '작성제목': item.blog_title || '',
            '발행일': item.published_date || '',
            '상태': statusLabels[item.status] || item.status || '대기',
            '블로그링크': item.blog_url || '',
            '블로그아이디': item.blog_id || '',
          }));
          break;

        case 'receipt':
          sheetName = '네이버영수증';
          excelData = contentItems.map((item: any, index: number) => ({
            '순번': index + 1,
            '접수번호': submission.submission_number || '',
            '업체명': submission.company_name || '',
            '리뷰등록일': item.review_registered_date || '',
            '영수증일자': item.receipt_date || '',
            '상태': statusLabels[item.review_status] || item.review_status || '대기',
            '리뷰링크': item.review_link || '',
            '리뷰ID': item.review_id || '',
          }));
          break;

        case 'kakaomap':
          sheetName = '카카오맵';
          excelData = contentItems.map((item: any, index: number) => ({
            '순번': index + 1,
            '접수번호': submission.submission_number || '',
            '업체명': submission.company_name || '',
            '리뷰원고': item.script_text || '',
            '리뷰등록일': item.review_registered_date || '',
            '영수증일자': item.receipt_date || '',
            '상태': statusLabels[item.review_status] || item.review_status || '대기',
            '리뷰링크': item.review_link || '',
            '리뷰ID': item.review_id || '',
          }));
          break;

        case 'cafe':
          sheetName = '카페마케팅';
          excelData = contentItems.map((item: any, index: number) => ({
            '순번': index + 1,
            '작성제목': item.post_title || '',
            '발행일': item.published_date || '',
            '상태': statusLabels[item.status] || item.status || '대기',
            '리뷰링크': item.post_url || '',
            '작성아이디': item.writer_id || '',
            '카페명': item.cafe_name || '',
          }));
          break;

        default:
          sheetName = '리포트';
          excelData = contentItems.map((item: any, index: number) => ({
            '순번': index + 1,
            '데이터': JSON.stringify(item),
          }));
      }

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const today = new Date().toISOString().split('T')[0];
      const fileName = `${productInfo.label}_${submission.submission_number || submission.company_name}_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: '다운로드 완료',
        description: `${contentItems.length}건의 콘텐츠가 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: '다운로드 실패',
        description: error instanceof Error ? error.message : '리포트 다운로드 중 오류가 발생했습니다.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // AS 신청 핸들러
  const handleAsRequest = (submission: UnifiedSubmission) => {
    if (submission.status !== 'completed') {
      setAsConditionDialogOpen(true);
      return;
    }

    // AS 신청 페이지로 이동
    const typeMap: Record<string, string> = {
      place: 'place',
      receipt: 'receipt',
      kakaomap: 'kakaomap',
      blog: 'blog',
      cafe: 'cafe',
      experience: 'experience',
    };

    const type = typeMap[submission.product_type] || submission.product_type;
    router.push(`/dashboard/as-request?submission_id=${submission.id}&type=${type}`);
  };

  return {
    submissions,
    stats,
    loading,
    selectedCategory,
    productFilter,
    statusFilter,
    searchQuery,
    sortBy,
    cancelDialogOpen,
    selectedSubmission,
    downloadingId,
    asConditionDialogOpen,
    setSearchQuery,
    setStatusFilter,
    setSortBy,
    setCancelDialogOpen,
    setAsConditionDialogOpen,
    handleCategorySelect,
    handleProductSelect,
    handleCancelClick,
    handleConfirmCancel,
    handleDownloadReport,
    handleAsRequest,
  };
}
