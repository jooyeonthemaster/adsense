import ExcelJS from 'exceljs';

export interface ParsedKakaomapContent {
  image?: {
    buffer: Buffer;
    extension: string;
    mimeType: string;
  };
  script: string;
  row: number;
}

export interface ExcelParseResult {
  items: ParsedKakaomapContent[];
  errors: string[];
}

/**
 * 엑셀 파일에서 K맵 리뷰 콘텐츠를 파싱합니다.
 *
 * 예상 엑셀 형식:
 * - A열: 순번 (선택)
 * - B열: 리뷰 원고 (필수)
 * - 이미지: 각 행에 삽입된 이미지 (선택)
 *
 * @param file - 업로드된 엑셀 파일
 * @returns 파싱된 콘텐츠 목록 및 에러
 */
export async function parseKakaomapExcel(file: File): Promise<ExcelParseResult> {
  const items: ParsedKakaomapContent[] = [];
  const errors: string[] = [];

  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      errors.push('워크시트를 찾을 수 없습니다.');
      return { items, errors };
    }

    // 이미지 매핑 생성 (row -> image)
    const imageMap = new Map<number, { buffer: Buffer; extension: string; mimeType: string }>();

    // 브라우저 환경에서 이미지 추출은 제한적이므로 스킵
    // 사용자는 이미지를 별도로 직접 업로드해야 함
    try {
      if (workbook.model?.media && worksheet.getImages) {
        // 엑셀 이미지 추출 (브라우저에서는 제한적)
        worksheet.getImages().forEach((image) => {
          const img = workbook.model.media?.find((m: any) => m.index === image.imageId);
          if (img) {
            // 이미지가 위치한 행 계산
            const range = image.range;
            const fromRow = (range as any).tl?.nativeRow || (range as any).from?.nativeRow;

            if (fromRow !== undefined) {
              const rowNumber = fromRow + 1; // 0-based to 1-based
              imageMap.set(rowNumber, {
                buffer: img.buffer instanceof Buffer ? img.buffer : Buffer.from(img.buffer),
                extension: img.extension,
                mimeType: getMimeType(img.extension),
              });
            }
          }
        });
      }
    } catch (imageError) {
      // 이미지 추출 실패 시 무시하고 텍스트만 파싱
      console.warn('이미지 추출 실패 (텍스트만 파싱):', imageError);
    }

    // 데이터 행 처리 (헤더 제외, 2행부터 시작)
    let dataStartRow = 2;

    // 1행이 헤더인지 확인
    const firstRow = worksheet.getRow(1);
    const firstCellValue = firstRow.getCell(2).value;
    if (
      firstCellValue &&
      typeof firstCellValue === 'string' &&
      (firstCellValue.includes('원고') || firstCellValue.includes('리뷰') || firstCellValue.includes('내용'))
    ) {
      // 헤더가 있음, 2행부터 시작
      dataStartRow = 2;
    } else {
      // 헤더가 없음, 1행부터 시작
      dataStartRow = 1;
    }

    worksheet.eachRow((row, rowNumber) => {
      // 헤더 행 건너뛰기
      if (rowNumber < dataStartRow) return;

      // B열: 리뷰 원고
      const scriptCell = row.getCell(2);
      let script = '';

      if (scriptCell.value) {
        if (typeof scriptCell.value === 'string') {
          script = scriptCell.value.trim();
        } else if (typeof scriptCell.value === 'object' && 'text' in scriptCell.value) {
          // Rich text
          script = (scriptCell.value as any).text?.trim() || '';
        }
      }

      // 원고가 비어있으면 건너뛰기
      if (!script) {
        return;
      }

      // 해당 행의 이미지 찾기
      const image = imageMap.get(rowNumber);

      items.push({
        image,
        script,
        row: rowNumber,
      });
    });

    if (items.length === 0) {
      errors.push('유효한 데이터를 찾을 수 없습니다. B열에 리뷰 원고를 입력해주세요.');
    }

  } catch (error) {
    console.error('Excel parsing error:', error);
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

/**
 * Buffer를 Base64 Data URL로 변환 (미리보기용)
 */
export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Buffer를 Blob으로 변환 (업로드용)
 */
export function bufferToBlob(buffer: Buffer, mimeType: string): Blob {
  return new Blob([new Uint8Array(buffer)], { type: mimeType });
}
