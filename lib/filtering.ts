import { createClient } from '@/utils/supabase/server';
import type { FilterOptions } from '@/types/analytics';

/**
 * Supabase 쿼리에 필터 적용
 */
export function applyFilters(query: any, filters: FilterOptions) {
  let modifiedQuery = query;

  // 날짜 범위 필터
  if (filters.dateRange) {
    const { start, end, field = 'created_at' } = filters.dateRange;
    modifiedQuery = modifiedQuery
      .gte(field, start)
      .lte(field, end);
  }

  // 상태 필터
  if (filters.status && filters.status.length > 0) {
    modifiedQuery = modifiedQuery.in('status', filters.status);
  }

  // 거래처 필터
  if (filters.clientIds && filters.clientIds.length > 0) {
    modifiedQuery = modifiedQuery.in('client_id', filters.clientIds);
  }

  // 포인트 범위 필터
  if (filters.pointRange) {
    modifiedQuery = modifiedQuery
      .gte('total_points', filters.pointRange.min)
      .lte('total_points', filters.pointRange.max);
  }

  // 정렬
  if (filters.orderBy) {
    modifiedQuery = modifiedQuery.order(filters.orderBy.field, {
      ascending: filters.orderBy.direction === 'asc',
    });
  } else {
    // 기본 정렬: 생성일 내림차순
    modifiedQuery = modifiedQuery.order('created_at', { ascending: false });
  }

  // 페이지네이션
  if (filters.pagination) {
    const { page, limit } = filters.pagination;
    const start = (page - 1) * limit;
    modifiedQuery = modifiedQuery.range(start, start + limit - 1);
  }

  return modifiedQuery;
}

/**
 * 통합 접수 내역 필터링 조회
 */
export async function getFilteredSubmissions(filters: FilterOptions) {
  const supabase = await createClient();

  const submissionTypes = filters.submissionTypes || ['place', 'receipt', 'kakaomap', 'blog'];
  const results: any[] = [];

  // 각 상품 타입별로 쿼리 실행
  for (const type of submissionTypes) {
    let tableName: string;

    switch (type) {
      case 'place':
        tableName = 'place_submissions';
        break;
      case 'receipt':
        tableName = 'receipt_review_submissions';
        break;
      case 'kakaomap':
        tableName = 'kakaomap_review_submissions';
        break;
      case 'blog':
        tableName = 'blog_distribution_submissions';
        break;
      default:
        continue;
    }

    // 기본 쿼리 생성
    let query = supabase.from(tableName).select('*, clients(company_name)');

    // 필터 적용 (페이지네이션 제외)
    const { pagination, ...filtersWithoutPagination } = filters;
    query = applyFilters(query, filtersWithoutPagination);

    const { data, error } = await query;

    if (!error && data) {
      results.push(...data.map((item) => ({ ...item, type })));
    }
  }

  // 통합 정렬
  if (filters.orderBy) {
    results.sort((a, b) => {
      const aVal = a[filters.orderBy!.field];
      const bVal = b[filters.orderBy!.field];

      if (filters.orderBy!.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  } else {
    // 기본: created_at 내림차순
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // 페이지네이션 적용
  if (filters.pagination) {
    const { page, limit } = filters.pagination;
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: results.slice(start, end),
      total: results.length,
      page,
      limit,
      totalPages: Math.ceil(results.length / limit),
    };
  }

  return {
    data: results,
    total: results.length,
    page: 1,
    limit: results.length,
    totalPages: 1,
  };
}

/**
 * 포인트 거래 내역 필터링 조회
 */
export async function getFilteredPointTransactions(filters: FilterOptions) {
  const supabase = await createClient();

  let query = supabase
    .from('point_transactions')
    .select('*, clients(company_name), admins(name)');

  // 거래 유형 필터 (transaction_type)
  if (filters.search?.fields.includes('transaction_type') && filters.search.query) {
    query = query.eq('transaction_type', filters.search.query);
  }

  // 필터 적용
  query = applyFilters(query, filters);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`포인트 거래 조회 오류: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || data?.length || 0,
  };
}

/**
 * AS 신청 내역 필터링 조회
 */
export async function getFilteredASRequests(filters: FilterOptions) {
  const supabase = await createClient();

  let query = supabase
    .from('as_requests')
    .select('*, clients(company_name), admins(name)');

  // 필터 적용
  query = applyFilters(query, filters);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`AS 신청 조회 오류: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || data?.length || 0,
  };
}

/**
 * 거래처 목록 필터링 조회
 */
export async function getFilteredClients(filters: FilterOptions) {
  const supabase = await createClient();

  let query = supabase.from('clients').select('*');

  // 활성 상태 필터
  if (filters.search?.fields.includes('is_active') && filters.search.query) {
    query = query.eq('is_active', filters.search.query === 'true');
  }

  // 검색 (회사명, 담당자, 이메일)
  if (filters.search?.query && filters.search.fields.length > 0) {
    const searchQuery = filters.search.query;
    if (filters.search.fields.includes('company_name')) {
      query = query.ilike('company_name', `%${searchQuery}%`);
    }
  }

  // 정렬
  if (filters.orderBy) {
    query = query.order(filters.orderBy.field, {
      ascending: filters.orderBy.direction === 'asc',
    });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // 페이지네이션
  if (filters.pagination) {
    const { page, limit } = filters.pagination;
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`거래처 조회 오류: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || data?.length || 0,
    page: filters.pagination?.page || 1,
    limit: filters.pagination?.limit || (data?.length || 0),
    totalPages: filters.pagination
      ? Math.ceil((count || data?.length || 0) / filters.pagination.limit)
      : 1,
  };
}
