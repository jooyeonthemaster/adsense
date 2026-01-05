import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * 마감일 계산 헬퍼 함수
 */
function calculateEndDate(startDate: string | null | undefined, totalDays: number | null | undefined): string | null {
  if (!startDate || !totalDays) return null;
  try {
    const start = new Date(startDate);
    start.setDate(start.getDate() + totalDays - 1); // 시작일 포함이므로 -1
    return start.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

interface UnifiedSubmission {
  id: string;
  product_type: 'place' | 'receipt' | 'kakaomap' | 'blog' | 'cafe' | 'experience';
  submission_number?: string;
  company_name: string;
  status: string;
  total_points: number;
  created_at: string;
  updated_at: string;
  start_date?: string; // 구동 시작일
  end_date?: string | null; // 구동 마감일 (계산됨)

  // Product-specific fields
  place_url?: string;
  place_mid?: string;
  daily_count?: number;
  total_days?: number;
  current_day?: number;
  total_count?: number;

  // Reward-specific
  media_type?: 'twoople' | 'eureka';

  // Blog-specific
  distribution_type?: 'reviewer' | 'video' | 'automation';
  keywords?: string[];
  account_id?: string; // 외부계정 충전용
  charge_count?: number; // 외부계정 충전용

  // Cafe-specific
  service_type?: 'cafe' | 'community'; // 카페 침투 / 커뮤니티 마케팅 구분
  cafe_list?: string[];
  has_photo?: boolean;
  script_status?: string;
  script_url?: string;

  // Experience-specific
  experience_type?: string;
  team_count?: number;
  bloggers_registered?: boolean;
  bloggers_selected?: boolean;
  schedule_confirmed?: boolean;
  client_confirmed?: boolean;
  all_published?: boolean;
  campaign_completed?: boolean;

  // Common optional fields
  notes?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session || !session.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // 쿼리 파라미터
    const productType = searchParams.get('product_type'); // all, place, receipt, kakaomap, blog, cafe, experience
    const status = searchParams.get('status'); // all, pending, in_progress, completed, cancelled
    const searchQuery = searchParams.get('search'); // 업체명 검색
    const sortBy = searchParams.get('sort_by') || 'date'; // date, cost, progress
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const allSubmissions: UnifiedSubmission[] = [];

    // 1. Place Submissions (플레이스 유입)
    if (!productType || productType === 'all' || productType === 'place') {
      const { data: placeData, error: placeError } = await supabase
        .from('place_submissions')
        .select('*')
        .eq('client_id', session.id)
        .order('created_at', { ascending: false });

      if (placeError) {
        console.error('Place submissions error:', placeError);
      } else if (placeData) {
        placeData.forEach((item) => {
          // MID 추출
          const mid = extractMidFromUrl(item.place_url);

          allSubmissions.push({
            id: item.id,
            product_type: 'place',
            submission_number: item.submission_number,
            company_name: item.company_name,
            status: item.status,
            total_points: item.total_points,
            created_at: item.created_at,
            updated_at: item.updated_at,
            place_url: item.place_url,
            place_mid: mid,
            daily_count: item.daily_count,
            total_days: item.total_days,
            current_day: calculateCurrentDay(item),
            media_type: item.media_type || 'twoople', // 투플/유레카 구분
            notes: item.notes,
            start_date: item.start_date,
            end_date: calculateEndDate(item.start_date, item.total_days),
          });
        });
      }
    }

    // 2. Receipt Review Submissions (영수증 리뷰)
    if (!productType || productType === 'all' || productType === 'receipt') {
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipt_review_submissions')
        .select('*')
        .eq('client_id', session.id)
        .order('created_at', { ascending: false });

      if (receiptError) {
        console.error('Receipt submissions error:', receiptError);
      } else if (receiptData) {
        receiptData.forEach((item) => {
          const mid = extractMidFromUrl(item.place_url);
          const totalDays = item.daily_count > 0 ? Math.ceil(item.total_count / item.daily_count) : null;

          allSubmissions.push({
            id: item.id,
            product_type: 'receipt',
            submission_number: item.submission_number,
            company_name: item.company_name,
            status: item.status,
            total_points: item.total_points,
            created_at: item.created_at,
            updated_at: item.updated_at,
            place_url: item.place_url,
            place_mid: mid,
            daily_count: item.daily_count,
            total_count: item.total_count,
            has_photo: item.has_photo,
            notes: item.notes,
            start_date: item.start_date,
            end_date: calculateEndDate(item.start_date, totalDays),
          });
        });
      }
    }

    // 3. Kakaomap Review Submissions (카카오맵 리뷰)
    if (!productType || productType === 'all' || productType === 'kakaomap') {
      const { data: kakaomapData, error: kakaomapError } = await supabase
        .from('kakaomap_review_submissions')
        .select('*')
        .eq('client_id', session.id)
        .order('created_at', { ascending: false });

      if (kakaomapError) {
        console.error('Kakaomap submissions error:', kakaomapError);
      } else if (kakaomapData) {
        kakaomapData.forEach((item) => {
          const totalDays = item.daily_count > 0 ? Math.ceil(item.total_count / item.daily_count) : null;

          allSubmissions.push({
            id: item.id,
            product_type: 'kakaomap',
            submission_number: item.submission_number,
            company_name: item.company_name,
            status: item.status,
            total_points: item.total_points,
            created_at: item.created_at,
            updated_at: item.updated_at,
            place_url: item.kakaomap_url,
            daily_count: item.daily_count,
            total_count: item.total_count,
            has_photo: item.has_photo,
            script_status: item.script_confirmed ? 'confirmed' : 'pending',
            notes: item.notes,
            start_date: item.start_date,
            end_date: calculateEndDate(item.start_date, totalDays),
          });
        });
      }
    }

    // 4. Blog Distribution Submissions (블로그 배포)
    if (!productType || productType === 'all' || productType === 'blog') {
      const { data: blogData, error: blogError } = await supabase
        .from('blog_distribution_submissions')
        .select('*')
        .eq('client_id', session.id)
        .order('created_at', { ascending: false });

      if (blogError) {
        console.error('Blog submissions error:', blogError);
      } else if (blogData) {
        blogData.forEach((item) => {
          const totalDays = item.daily_count > 0 ? Math.ceil(item.total_count / item.daily_count) : null;

          allSubmissions.push({
            id: item.id,
            product_type: 'blog',
            submission_number: item.submission_number,
            company_name: item.company_name,
            status: item.status,
            total_points: item.total_points,
            created_at: item.created_at,
            updated_at: item.updated_at,
            place_url: item.place_url,
            daily_count: item.daily_count,
            total_count: item.total_count,
            total_days: totalDays ?? undefined,
            distribution_type: item.distribution_type,
            keywords: item.keywords,
            account_id: item.account_id, // 외부계정 충전용
            charge_count: item.charge_count, // 외부계정 충전용
            notes: item.notes,
            start_date: item.start_date,
            end_date: calculateEndDate(item.start_date, totalDays),
          });
        });
      }
    }

    // 5. Experience Submissions (체험단 - 별도 테이블)
    if (!productType || productType === 'all' || productType === 'experience') {
      const { data: experienceData, error: experienceError } = await supabase
        .from('experience_submissions')
        .select('*')
        .eq('client_id', session.id)
        .order('created_at', { ascending: false });

      if (experienceError) {
        console.error('Experience submissions error:', experienceError);
      } else if (experienceData) {
        experienceData.forEach((item) => {
          allSubmissions.push({
            id: item.id,
            product_type: 'experience',
            submission_number: item.submission_number,
            company_name: item.company_name,
            status: item.status,
            total_points: item.total_points,
            created_at: item.created_at,
            updated_at: item.updated_at,
            place_url: item.place_url,
            experience_type: item.experience_type,
            team_count: item.team_count,
            keywords: item.keywords,
            notes: item.guide_text,
            start_date: item.start_date,
            end_date: null, // 체험단은 캠페인 완료 시점이 마감이므로 미정
            // 진행 상태 필드 추가
            bloggers_registered: item.bloggers_registered,
            bloggers_selected: item.bloggers_selected,
            schedule_confirmed: item.schedule_confirmed,
            client_confirmed: item.client_confirmed,
            all_published: item.all_published,
            campaign_completed: item.campaign_completed,
          });
        });
      }
    }

    // 6. Cafe Marketing Submissions
    if (!productType || productType === 'all' || productType === 'cafe') {
      const { data: cafeData, error: cafeError } = await supabase
        .from('cafe_marketing_submissions')
        .select('*')
        .eq('client_id', session.id)
        .order('created_at', { ascending: false });

      if (cafeError) {
        console.error('Cafe submissions error:', cafeError);
      } else if (cafeData) {
        cafeData.forEach((item: any) => {
          const placeMid = extractMidFromUrl(item.place_url);
          const cafeList = Array.isArray(item.cafe_details)
            ? item.cafe_details
                .map((cafe: any) => cafe?.name)
                .filter((name: string | undefined): name is string => Boolean(name))
            : [];

          // 마감일 계산: 일일 건수로 총 기간 계산
          const totalDays = item.daily_count > 0 ? Math.ceil(item.total_count / item.daily_count) : null;

          allSubmissions.push({
            id: item.id,
            product_type: 'cafe',
            submission_number: item.submission_number,
            company_name: item.company_name,
            status: mapCafeStatus(item.status),
            total_points: item.total_points,
            created_at: item.created_at,
            updated_at: item.updated_at,
            place_url: item.place_url,
            place_mid: placeMid,
            service_type: item.service_type || 'cafe', // 카페 침투 / 커뮤니티 마케팅 구분
            cafe_list: cafeList,
            has_photo: item.has_photo,
            script_status: item.script_status || 'pending',
            script_url: item.script_url,
            total_count: item.total_count,
            notes: item.guideline || item.notes,
            start_date: item.start_date,
            end_date: calculateEndDate(item.start_date, totalDays),
          });
        });
      }
    }

    // 필터링 적용
    let filteredSubmissions = allSubmissions;

    // 상태 필터
    if (status && status !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => sub.status === status
      );
    }

    // 검색 쿼리 (업체명, MID)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredSubmissions = filteredSubmissions.filter(
        (sub) =>
          sub.company_name.toLowerCase().includes(query) ||
          sub.place_mid?.includes(query)
      );
    }

    // 날짜 범위 필터
    if (startDate) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => new Date(sub.created_at) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredSubmissions = filteredSubmissions.filter(
        (sub) => new Date(sub.created_at) <= new Date(endDate)
      );
    }

    // 정렬
    filteredSubmissions.sort((a, b) => {
      if (sortBy === 'cost') {
        return b.total_points - a.total_points;
      } else if (sortBy === 'progress') {
        const progressA = calculateProgress(a);
        const progressB = calculateProgress(b);
        return progressB - progressA;
      } else {
        // 기본: 날짜순
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // 통계 계산
    const stats = {
      total: allSubmissions.length,
      pending: allSubmissions.filter((s) => s.status === 'pending').length,
      in_progress: allSubmissions.filter((s) => s.status === 'in_progress').length,
      completed: allSubmissions.filter((s) => s.status === 'completed').length,
      cancelled: allSubmissions.filter((s) => s.status === 'cancelled').length,
      total_cost: allSubmissions.reduce((sum, s) => sum + s.total_points, 0),
      by_product: {
        place: allSubmissions.filter((s) => s.product_type === 'place').length,
        receipt: allSubmissions.filter((s) => s.product_type === 'receipt').length,
        kakaomap: allSubmissions.filter((s) => s.product_type === 'kakaomap').length,
        blog: allSubmissions.filter((s) => s.product_type === 'blog').length,
        cafe: allSubmissions.filter((s) => s.product_type === 'cafe').length,
        experience: allSubmissions.filter((s) => s.product_type === 'experience').length,
      },
    };

    return NextResponse.json({
      submissions: filteredSubmissions,
      stats,
    });
  } catch (error) {
    console.error('All submissions API error:', error);
    return NextResponse.json(
      { error: '접수 현황을 불러오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// Helper: 카페 상태 매핑
function mapCafeStatus(status: string): UnifiedSubmission['status'] {
  switch (status) {
    case 'approved':
    case 'script_writing':
    case 'script_completed':
      return 'in_progress';
    case 'pending':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
      return status;
    default:
      return 'pending';
  }
}

// Helper: MID 추출
function extractMidFromUrl(url: string): string {
  if (!url) return '';

  // 네이버 플레이스 URL에서 MID 추출
  const match = url.match(/place\/(\d+)/);
  if (match) {
    return match[1];
  }

  return '';
}

// Helper: 현재 진행일 계산
function calculateCurrentDay(submission: any): number {
  if (!submission.start_date || submission.status !== 'in_progress') {
    return 0;
  }

  const startDate = new Date(submission.start_date);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.min(diffDays, submission.total_days || 0);
}

// Helper: 진행률 계산
function calculateProgress(submission: UnifiedSubmission): number {
  if (submission.status === 'completed') return 100;
  if (submission.status === 'pending' || !submission.current_day) return 0;

  if (submission.total_days) {
    return (submission.current_day / submission.total_days) * 100;
  }

  return 0;
}