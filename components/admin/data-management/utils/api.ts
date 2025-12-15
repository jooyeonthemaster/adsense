import type { ValidationResult, DeployResult, ParsedRecord, SheetData } from '../types';

// 배포 API 요청 페이로드 생성
function createDeployPayload(sheets: SheetData[]) {
  return {
    sheets: sheets.map((sheet) => ({
      productType: sheet.productType,
      records: sheet.records
        .filter((r) => r.isValid && r.submissionId)
        .map((r: ParsedRecord) => ({
          submissionId: r.submissionId,
          companyName: r.companyName,
          date: r.date,
          count: r.count,
          scriptText: r.scriptText,
          notes: r.notes,
          // K맵 리뷰 전용 필드
          reviewRegisteredDate: r.reviewRegisteredDate,
          receiptDate: r.receiptDate,
          reviewStatus: r.reviewStatus,
          reviewLink: r.reviewLink,
          reviewId: r.reviewId,
          // 블로그 배포 전용 필드
          blogTitle: r.blogTitle,
          publishedDate: r.publishedDate,
          blogStatus: r.blogStatus,
          blogUrl: r.blogUrl,
          blogId: r.blogId,
          // 카페 침투 전용 필드
          cafePostTitle: r.cafePostTitle,
          cafePublishedDate: r.cafePublishedDate,
          cafeStatus: r.cafeStatus,
          cafePostUrl: r.cafePostUrl,
          cafeWriterId: r.cafeWriterId,
          cafeName: r.cafeName,
        })),
    })),
  };
}

// 배포 API 호출
export async function deployToDatabase(validationResult: ValidationResult): Promise<DeployResult> {
  if (!validationResult || validationResult.validRecords === 0) {
    return {
      success: false,
      message: '저장할 유효한 데이터가 없습니다.',
    };
  }

  try {
    const response = await fetch('/api/admin/data-management/bulk-daily-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createDeployPayload(validationResult.sheets)),
    });

    const result = await response.json();

    if (response.ok) {
      const contentMsg =
        result.contentItemsCreated > 0 ? ` (리뷰 원고 ${result.contentItemsCreated}건 생성)` : '';
      const progressMsg =
        result.progressUpdated > 0 ? ` / ${result.progressUpdated}건 진행률 업데이트` : '';

      return {
        success: true,
        message: `${result.totalSuccess}건이 성공적으로 저장되었습니다.${contentMsg}${progressMsg}`,
        details: {
          success: result.totalSuccess,
          failed: result.totalFailed,
          errors: result.errors || [],
        },
        progressDebug: result.progressDebug,
      };
    } else {
      return {
        success: false,
        message: result.error || '저장 중 오류가 발생했습니다.',
        details: result.details,
      };
    }
  } catch (error) {
    console.error('배포 오류:', error);
    return {
      success: false,
      message: '서버 통신 중 오류가 발생했습니다.',
    };
  }
}
