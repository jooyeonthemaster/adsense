'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter } from 'lucide-react';
import { UnifiedSubmission, AllSubmissionsStats, SubmissionStatus } from '@/types/submission';
import { productConfig, categoryProducts } from '@/config/submission-products';
import { StatsCards } from '@/components/dashboard/submissions/StatsCards';
import { CategoryFilter } from '@/components/dashboard/submissions/CategoryFilter';
import { SubmissionTableRow } from '@/components/dashboard/submissions/SubmissionTableRow';
import { SubmissionCard } from '@/components/dashboard/submissions/SubmissionCard';
import { CancelDialog } from '@/components/dashboard/submissions/CancelDialog';
import { calculateProgress } from '@/lib/submission-utils';
import { getMockSubmissions, calculateMockStats } from './mockData';

export default function AllSubmissionsPage() {
  const [submissions, setSubmissions] = useState<UnifiedSubmission[]>([]);
  const [stats, setStats] = useState<AllSubmissionsStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'progress'>('date');

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<UnifiedSubmission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [productFilter, statusFilter, searchQuery, sortBy]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);

    if (category === 'all') {
      setProductFilter('all');
    } else {
      const products = categoryProducts[category];
      if (products.length === 1) {
        setProductFilter(products[0]);
      } else {
        setProductFilter('category-all');
      }
    }
  };

  const handleProductSelect = (product: string) => {
    setProductFilter(product);
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
              if (configAny.subType) {
                if (config.productType === 'blog' && s.distribution_type === configAny.subType) {
                  return activeProducts.includes(key);
                } else if (config.productType === 'experience' && s.experience_type === configAny.subType) {
                  return activeProducts.includes(key);
                }
              } else {
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
              if (configAny.subType) {
                if (config.productType === 'blog' && s.distribution_type === configAny.subType) {
                  return activeProducts.includes(key);
                } else if (config.productType === 'experience' && s.experience_type === configAny.subType) {
                  return activeProducts.includes(key);
                }
              } else {
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

  const handleConfirmCancel = async () => {
    if (!selectedSubmission) return;

    try {
      // TODO: 중단 API 호출
      alert('중단 신청이 완료되었습니다.');
      setCancelDialogOpen(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Cancel request error:', error);
      alert('중단 신청에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">통합 접수 현황</h1>
          <p className="text-sky-100">모든 마케팅 상품의 접수 현황을 한눈에 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        {stats && <StatsCards stats={stats} />}

        {/* 카테고리 필터 */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          productFilter={productFilter}
          onCategorySelect={handleCategorySelect}
          onProductSelect={handleProductSelect}
        />

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="업체명 또는 MID로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as SubmissionStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-40 h-10 text-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="in_progress">구동중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="cancelled">중단됨</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'cost' | 'progress')}>
            <SelectTrigger className="w-full sm:w-40 h-10 text-sm">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">접수일순</SelectItem>
              <SelectItem value="cost">비용순</SelectItem>
              <SelectItem value="progress">진행률순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 - Desktop */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">상품</TableHead>
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">상세 정보</TableHead>
                <TableHead className="text-xs font-semibold">진행 상태</TableHead>
                <TableHead className="text-xs font-semibold">접수일시</TableHead>
                <TableHead className="text-xs font-semibold text-right">비용</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableHead colSpan={7} className="text-center py-12 text-sm text-gray-500">
                    접수 내역이 없습니다.
                  </TableHead>
                </TableRow>
              ) : (
                submissions.map((submission) => (
                  <SubmissionTableRow
                    key={submission.id}
                    submission={submission}
                    onCancel={handleCancelClick}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 카드 - Mobile */}
        <div className="md:hidden space-y-3">
          {submissions.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onCancel={handleCancelClick}
              />
            ))
          )}
        </div>
      </div>

      {/* 중단 확인 다이얼로그 */}
      <CancelDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        submission={selectedSubmission}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
