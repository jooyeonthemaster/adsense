import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateExcelReport, generateReportFileName } from '@/lib/excel-reports';
import type { ExcelReportOptions } from '@/lib/excel-reports';

/**
 * POST /api/reports/download
 * 엑셀 리포트 생성 및 다운로드
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const body = await request.json();
    const options: ExcelReportOptions = {
      reportType: body.reportType,
      filters: body.filters || {},
      includeStatistics: body.includeStatistics || false,
    };

    // 엑셀 파일 생성
    const buffer = await generateExcelReport(options);

    // 파일명 생성
    const fileName = generateReportFileName(options.reportType);

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error in POST /api/reports/download:', error);
    return NextResponse.json(
      { error: '엑셀 리포트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
