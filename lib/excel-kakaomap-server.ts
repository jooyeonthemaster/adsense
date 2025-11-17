import ExcelJS from 'exceljs';

export interface ParsedKakaomapItem {
  script: string;
  row: number;
}

export interface ServerExcelParseResult {
  items: ParsedKakaomapItem[];
  errors: string[];
}

/**
 * 서버 사이드에서 Excel 파일을 파싱합니다 (Node.js 환경)
 * 브라우저와 달리 이미지 추출이 안정적으로 작동합니다.
 */
export async function parseKakaomapExcelServer(
  buffer: Buffer
): Promise<ServerExcelParseResult> {
  const items: ParsedKakaomapItem[] = [];
  const errors: string[] = [];

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      errors.push('워크시트를 찾을 수 없습니다.');
      return { items, errors };
    }

    // 이미지는 사용자가 사이트에서 직접 업로드하도록 함 (Excel 이미지 추출 제외)

    // 데이터 행 처리
    let dataStartRow = 2;

    // 1행이 헤더인지 확인
    const firstRow = worksheet.getRow(1);
    const firstCellValue = firstRow.getCell(2).value;
    if (
      firstCellValue &&
      typeof firstCellValue === 'string' &&
      (firstCellValue.includes('원고') ||
       firstCellValue.includes('리뷰') ||
       firstCellValue.includes('내용') ||
       firstCellValue.includes('script'))
    ) {
      dataStartRow = 2;
    } else {
      dataStartRow = 1;
    }

    // 각 행 처리
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return;

      // B열: 리뷰 원고
      const scriptCell = row.getCell(2);
      let script = '';

      if (scriptCell.value) {
        if (typeof scriptCell.value === 'string') {
          script = scriptCell.value.trim();
        } else if (typeof scriptCell.value === 'object' && 'text' in scriptCell.value) {
          script = (scriptCell.value as any).text?.trim() || '';
        }
      }

      // 원고가 비어있으면 건너뛰기
      if (!script) {
        return;
      }

      items.push({
        script,
        row: rowNumber,
      });
    });

    if (items.length === 0) {
      errors.push('유효한 데이터를 찾을 수 없습니다. B열에 리뷰 원고를 입력해주세요.');
    }

  } catch (error) {
    console.error('Excel 파싱 오류:', error);
    errors.push(`파일 파싱 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }

  return { items, errors };
}

/**
 * 파일 확장자로부터 MIME 타입 반환
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
  };
  return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
}
