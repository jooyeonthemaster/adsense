import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { BULK_PRODUCT_CONFIG } from '@/components/dashboard/bulk-submission/constants';
import type { BulkSubmissionProduct } from '@/components/dashboard/bulk-submission/types';

/**
 * 관리자 접수 내역 엑셀 내보내기 API
 * 대량 접수 템플릿과 동일한 형식으로 내보내기
 */

interface ExportFilters {
  productType?: BulkSubmissionProduct;
  status?: string;
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

/**
 * 날짜 형식 변환 (YYYY-MM-DD)
 */
function formatDate(date: string | null): string {
  if (!date) return '';
  return date.split('T')[0];
}

/**
 * 마감일 계산
 */
function calculateEndDate(startDate: string | null, totalDays: number | null): string {
  if (!startDate || !totalDays) return '';
  const start = new Date(startDate);
  start.setDate(start.getDate() + totalDays - 1);
  return start.toISOString().split('T')[0];
}

/**
 * 영수증 리뷰 내역 내보내기
 */
async function exportReceiptSubmissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ExportFilters
) {
  let query = supabase
    .from('receipt_review_submissions')
    .select('*, clients(company_name, username)')
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.clientId) query = query.eq('client_id', filters.clientId);
  if (filters.startDate) query = query.gte('created_at', filters.startDate);
  if (filters.endDate) query = query.lte('created_at', filters.endDate + 'T23:59:59');

  const { data: submissions, error } = await query;

  if (error) throw error;

  // 템플릿 컬럼 순서대로 변환
  return (submissions || []).map((sub, index) => ({
    순번: index + 1,
    '총 수량': sub.total_count,
    '일 수량': sub.daily_count,
    '이미지 건당 개수': sub.image_count_per_review || '',
    '플레이스 주소': sub.place_url,
    '발행 시작 날짜 지정 (선택)': formatDate(sub.start_date),
    '발행 요일 지정 (선택)': sub.publish_days || '',
    '발행 시간대 지정 (선택)': sub.publish_time_range || '',
    '이미지 랜덤여부(0:순서대로, 1:랜덤)(선택)': sub.image_random ? 1 : 0,
    '방문 일자 범위 (선택)': sub.visit_date_range || '',
    '가이드 라인 (선택)': sub.guideline || '',
    '원고 직접 등록 (선택)': sub.custom_script || '',
    '원고 + 사진 매칭 요청시 / 사진 파일명': sub.photo_filename || '',
    // 관리용 추가 컬럼
    '광고주 아이디': sub.clients?.username || '',
    접수번호: sub.submission_number,
    상태: sub.status,
    접수일: formatDate(sub.created_at),
  }));
}

/**
 * 블로그 배포 내역 내보내기
 */
async function exportBlogSubmissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ExportFilters,
  distributionType?: 'reviewer' | 'video' | 'automation'
) {
  let query = supabase
    .from('blog_distribution_submissions')
    .select('*, clients(company_name, username)')
    .order('created_at', { ascending: false });

  if (distributionType) query = query.eq('distribution_type', distributionType);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.clientId) query = query.eq('client_id', filters.clientId);
  if (filters.startDate) query = query.gte('created_at', filters.startDate);
  if (filters.endDate) query = query.lte('created_at', filters.endDate + 'T23:59:59');

  const { data: submissions, error } = await query;

  if (error) throw error;

  // 배포유형 한글 변환
  const distTypeKorean: Record<string, string> = {
    reviewer: '리뷰어',
    video: '247',
    automation: '자동화',
  };

  // 콘텐츠 타입 한글 변환
  const contentTypeKorean: Record<string, string> = {
    review: '후기성',
    info: '정보성',
  };

  return (submissions || []).map((sub) => ({
    '광고주 아이디': sub.clients?.username || '',
    배포유형: distTypeKorean[sub.distribution_type] || sub.distribution_type,
    시작날짜: formatDate(sub.start_date),
    종료날짜: calculateEndDate(sub.start_date, sub.total_days),
    글타입: contentTypeKorean[sub.content_type] || sub.content_type,
    플레이스링크: sub.place_url,
    일갯수: sub.daily_count,
    총갯수: sub.total_count,
    일수: sub.total_days,
    // 관리용 추가 컬럼
    접수번호: sub.submission_number,
    상태: sub.status,
    접수일: formatDate(sub.created_at),
  }));
}

/**
 * 트래픽/리워드 내역 내보내기
 */
async function exportPlaceSubmissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ExportFilters
) {
  let query = supabase
    .from('place_submissions')
    .select('*, clients(company_name, username)')
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.clientId) query = query.eq('client_id', filters.clientId);
  if (filters.startDate) query = query.gte('created_at', filters.startDate);
  if (filters.endDate) query = query.lte('created_at', filters.endDate + 'T23:59:59');

  const { data: submissions, error } = await query;

  if (error) throw error;

  return (submissions || []).map((sub) => ({
    '광고주 아이디': sub.clients?.username || '',
    상품명: sub.company_name || sub.business_name || '',
    'URL (m. 으로 시작하는 모바일링크 기재)': sub.place_url,
    '목표 키워드': sub.keywords || '',
    시작일: formatDate(sub.start_date),
    종료일: calculateEndDate(sub.start_date, sub.total_days),
    '구동 일수': sub.total_days,
    '일 수량': sub.daily_count,
    // 관리용 추가 컬럼
    접수번호: sub.submission_number,
    상태: sub.status,
    접수일: formatDate(sub.created_at),
  }));
}

/**
 * GET: 접수 내역 엑셀 다운로드
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType') as BulkSubmissionProduct | null;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const clientId = searchParams.get('clientId') || undefined;

    const filters: ExportFilters = { status, startDate, endDate, clientId };

    const workbook = XLSX.utils.book_new();
    let fileName = '접수내역';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');

    // 상품 타입별 내보내기
    if (!productType || productType === 'receipt') {
      const receiptData = await exportReceiptSubmissions(supabase, filters);
      if (receiptData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(receiptData);
        // 컬럼 너비 설정
        ws['!cols'] = BULK_PRODUCT_CONFIG.receipt.columns.map(() => ({ wch: 20 }));
        XLSX.utils.book_append_sheet(workbook, ws, '영수증리뷰');
      }
      if (productType === 'receipt') fileName = '영수증_리뷰_접수내역';
    }

    if (!productType || productType === 'blog_reviewer') {
      const reviewerData = await exportBlogSubmissions(supabase, filters, 'reviewer');
      if (reviewerData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(reviewerData);
        ws['!cols'] = BULK_PRODUCT_CONFIG.blog_reviewer.columns.map(() => ({ wch: 15 }));
        XLSX.utils.book_append_sheet(workbook, ws, '리뷰어배포');
      }
      if (productType === 'blog_reviewer') fileName = '리뷰어_배포_접수내역';
    }

    if (!productType || productType === 'blog_video') {
      const videoData = await exportBlogSubmissions(supabase, filters, 'video');
      if (videoData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(videoData);
        ws['!cols'] = BULK_PRODUCT_CONFIG.blog_video.columns.map(() => ({ wch: 15 }));
        XLSX.utils.book_append_sheet(workbook, ws, '247배포');
      }
      if (productType === 'blog_video') fileName = '247_배포_접수내역';
    }

    if (!productType || productType === 'blog_automation') {
      const automationData = await exportBlogSubmissions(supabase, filters, 'automation');
      if (automationData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(automationData);
        ws['!cols'] = BULK_PRODUCT_CONFIG.blog_automation.columns.map(() => ({ wch: 15 }));
        XLSX.utils.book_append_sheet(workbook, ws, '자동화배포');
      }
      if (productType === 'blog_automation') fileName = '자동화_배포_접수내역';
    }

    if (!productType || productType === 'place') {
      const placeData = await exportPlaceSubmissions(supabase, filters);
      if (placeData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(placeData);
        ws['!cols'] = BULK_PRODUCT_CONFIG.place.columns.map(() => ({ wch: 20 }));
        XLSX.utils.book_append_sheet(workbook, ws, '리워드');
      }
      if (productType === 'place') fileName = '트래픽_리워드_접수내역';
    }

    // 워크북에 시트가 없는 경우 빈 시트 추가
    if (workbook.SheetNames.length === 0) {
      const emptyWs = XLSX.utils.aoa_to_sheet([['데이터가 없습니다.']]);
      XLSX.utils.book_append_sheet(workbook, emptyWs, '데이터없음');
    }

    // 엑셀 버퍼 생성
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 응답 반환
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}_${dateStr}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/submissions/export:', error);
    return NextResponse.json(
      { error: '내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
