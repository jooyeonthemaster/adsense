import * as XLSX from 'xlsx';
import { createClient } from '@/utils/supabase/server';
import type { FilterOptions } from '@/types/analytics';
import { getFilteredSubmissions } from './filtering';

/**
 * 엑셀 리포트 생성 옵션
 */
export interface ExcelReportOptions {
  reportType: 'submissions' | 'transactions' | 'clients' | 'as_requests';
  filters?: FilterOptions;
  includeStatistics?: boolean;
}

/**
 * 전체 접수 내역 리포트 생성
 */
async function generateSubmissionsReport(filters?: FilterOptions) {
  const result = await getFilteredSubmissions(filters || {});
  const submissions = result.data;

  // 엑셀 데이터 변환
  const excelData = submissions.map((sub) => {
    const baseData = {
      접수번호: sub.id,
      거래처명: sub.clients?.company_name || '',
      상품타입:
        sub.type === 'place'
          ? '플레이스 유입'
          : sub.type === 'receipt'
          ? '영수증 리뷰'
          : sub.type === 'kakaomap'
          ? '카카오맵 리뷰'
          : '블로그 배포',
      회사명: sub.company_name,
      URL: sub.place_url || sub.kakaomap_url || '',
      일일건수: sub.daily_count,
      '총건수/일수': sub.total_count || sub.total_days,
      총포인트: sub.total_points,
      상태:
        sub.status === 'pending'
          ? '대기'
          : sub.status === 'approved'
          ? '승인'
          : sub.status === 'completed'
          ? '완료'
          : '취소',
      시작일: sub.start_date || '',
      접수일: new Date(sub.created_at).toLocaleString('ko-KR'),
      수정일: new Date(sub.updated_at).toLocaleString('ko-KR'),
      비고: sub.notes || '',
    };

    // 상품별 추가 필드
    if (sub.type === 'receipt') {
      return {
        ...baseData,
        사진포함: sub.has_photo ? 'Y' : 'N',
        스크립트포함: sub.has_script ? 'Y' : 'N',
      };
    } else if (sub.type === 'kakaomap') {
      return {
        ...baseData,
        텍스트리뷰수: sub.text_review_count,
        사진리뷰수: sub.photo_review_count,
      };
    } else if (sub.type === 'blog') {
      return {
        ...baseData,
        배포유형: sub.distribution_type,
        콘텐츠타입: sub.content_type,
      };
    }

    return baseData;
  });

  return excelData;
}

/**
 * 포인트 거래 내역 리포트 생성
 */
async function generateTransactionsReport(filters?: FilterOptions) {
  const supabase = await createClient();

  let query = supabase
    .from('point_transactions')
    .select('*, clients(company_name), admins(name)')
    .order('created_at', { ascending: false });

  const { data: transactions } = await query;

  const excelData = (transactions || []).map((txn) => ({
    거래번호: txn.id,
    거래처명: txn.clients?.company_name || '',
    거래유형:
      txn.transaction_type === 'charge'
        ? '충전'
        : txn.transaction_type === 'deduct'
        ? '차감'
        : '환불',
    거래금액: txn.amount,
    거래후잔액: txn.balance_after,
    관련타입: txn.reference_type || '',
    관련번호: txn.reference_id || '',
    설명: txn.description || '',
    처리자: txn.admins?.name || '시스템',
    거래일시: new Date(txn.created_at).toLocaleString('ko-KR'),
  }));

  return excelData;
}

/**
 * 거래처 마스터 리포트 생성
 */
async function generateClientsReport(filters?: FilterOptions) {
  const supabase = await createClient();

  // 거래처 정보 조회
  const { data: clients } = await supabase.from('clients').select('*').eq('is_active', true);

  // 각 거래처별 통계 계산
  const excelData = await Promise.all(
    (clients || []).map(async (client) => {
      // 총 접수 건수
      const [placeRes, receiptRes, kakaomapRes, blogRes] = await Promise.all([
        supabase
          .from('place_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id),
        supabase
          .from('receipt_review_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id),
        supabase
          .from('kakaomap_review_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id),
        supabase
          .from('blog_distribution_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id),
      ]);

      const totalSubmissions =
        (placeRes.count || 0) +
        (receiptRes.count || 0) +
        (kakaomapRes.count || 0) +
        (blogRes.count || 0);

      // 완료 건수
      const [placeCompRes, receiptCompRes, kakaomapCompRes, blogCompRes] = await Promise.all([
        supabase
          .from('place_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'completed'),
        supabase
          .from('receipt_review_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'completed'),
        supabase
          .from('kakaomap_review_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'completed'),
        supabase
          .from('blog_distribution_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'completed'),
      ]);

      const completedCount =
        (placeCompRes.count || 0) +
        (receiptCompRes.count || 0) +
        (kakaomapCompRes.count || 0) +
        (blogCompRes.count || 0);

      // 총 사용 포인트
      const { data: pointsUsed } = await supabase
        .from('point_transactions')
        .select('amount')
        .eq('client_id', client.id)
        .eq('transaction_type', 'deduct');

      const totalPointsUsed = (pointsUsed || []).reduce((sum, p) => sum + p.amount, 0);

      return {
        거래처ID: client.id,
        아이디: client.username,
        회사명: client.company_name,
        담당자: client.contact_person || '',
        연락처: client.phone || '',
        이메일: client.email || '',
        포인트잔액: client.points,
        활성여부: client.is_active ? 'Y' : 'N',
        총접수건수: totalSubmissions,
        완료건수: completedCount,
        총사용포인트: totalPointsUsed,
        가입일: new Date(client.created_at).toLocaleString('ko-KR'),
      };
    })
  );

  return excelData;
}

/**
 * AS 신청 내역 리포트 생성
 */
async function generateASRequestsReport(filters?: FilterOptions) {
  const supabase = await createClient();

  const { data: asRequests } = await supabase
    .from('as_requests')
    .select('*, clients(company_name), admins(name)')
    .order('created_at', { ascending: false });

  const excelData = (asRequests || []).map((as) => ({
    AS번호: as.id,
    거래처명: as.clients?.company_name || '',
    접수타입: as.submission_type,
    접수번호: as.submission_id,
    '부족률(%)': as.missing_rate,
    상세내용: as.description,
    상태:
      as.status === 'pending'
        ? '대기'
        : as.status === 'in_progress'
        ? '진행중'
        : as.status === 'resolved'
        ? '해결'
        : '거부',
    처리자: as.admins?.name || '',
    해결일시: as.resolved_at ? new Date(as.resolved_at).toLocaleString('ko-KR') : '',
    해결내용: as.resolution_notes || '',
    신청일시: new Date(as.created_at).toLocaleString('ko-KR'),
  }));

  return excelData;
}

/**
 * 메인 엑셀 리포트 생성 함수
 */
export async function generateExcelReport(options: ExcelReportOptions): Promise<Buffer> {
  let excelData: any[];
  let sheetName: string;

  // 리포트 타입별 데이터 생성
  switch (options.reportType) {
    case 'submissions':
      excelData = await generateSubmissionsReport(options.filters);
      sheetName = '접수내역';
      break;
    case 'transactions':
      excelData = await generateTransactionsReport(options.filters);
      sheetName = '포인트거래';
      break;
    case 'clients':
      excelData = await generateClientsReport(options.filters);
      sheetName = '거래처';
      break;
    case 'as_requests':
      excelData = await generateASRequestsReport(options.filters);
      sheetName = 'AS신청';
      break;
    default:
      throw new Error('Invalid report type');
  }

  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 메인 데이터 시트 생성
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 컬럼 너비 자동 조정
  const colWidths: { wch: number }[] = [];
  if (excelData.length > 0) {
    Object.keys(excelData[0]).forEach((key) => {
      const maxLength = Math.max(
        key.length,
        ...excelData.map((row) => String(row[key] || '').length)
      );
      colWidths.push({ wch: Math.min(maxLength + 2, 50) });
    });
  }
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 통계 시트 추가 (옵션)
  if (options.includeStatistics && options.reportType === 'submissions') {
    const stats = [
      { 항목: '총 건수', 값: excelData.length },
      {
        항목: '총 포인트',
        값: excelData.reduce((sum, row) => sum + (row.총포인트 || 0), 0),
      },
      {
        항목: '평균 포인트',
        값: Math.round(
          excelData.reduce((sum, row) => sum + (row.총포인트 || 0), 0) / excelData.length
        ),
      },
    ];

    const statsSheet = XLSX.utils.json_to_sheet(stats);
    XLSX.utils.book_append_sheet(workbook, statsSheet, '통계');
  }

  // Buffer로 변환
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  return buffer;
}

/**
 * 파일명 생성
 */
export function generateReportFileName(reportType: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');

  const typeNames = {
    submissions: '접수내역',
    transactions: '포인트거래',
    clients: '거래처마스터',
    as_requests: 'AS신청',
  };

  const typeName = typeNames[reportType as keyof typeof typeNames] || reportType;

  return `${typeName}_${dateStr}_${timeStr}.xlsx`;
}
