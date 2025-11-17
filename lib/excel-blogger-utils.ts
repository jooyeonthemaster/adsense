import * as XLSX from 'xlsx';
import { NewBlogger } from '@/types/experience-blogger';

/**
 * 엑셀 템플릿 다운로드
 */
export const downloadBloggerExcelTemplate = () => {
  const template = [
    ['이름', '블로그 URL', '블로그 지수'],
    ['홍길동', 'https://blog.naver.com/example1', '800'],
    ['김철수', 'https://blog.naver.com/example2', '750'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '블로거 목록');
  XLSX.writeFile(wb, '블로거_등록_양식.xlsx');
};

/**
 * 엑셀 파일에서 블로거 정보 파싱
 */
export const parseBloggerExcelFile = (
  file: File,
  onSuccess: (bloggers: NewBlogger[]) => void,
  onError: (message: string) => void
): void => {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      // Skip header row if exists, parse data
      const parsedBloggers = jsonData
        .slice(1) // Skip first row (header)
        .filter((row) => row[0] && row[1]) // Must have name and URL
        .map((row) => ({
          name: String(row[0] || '').trim(),
          blog_url: String(row[1] || '').trim(),
          index_score: parseInt(String(row[2] || '0')) || 0,
        }));

      if (parsedBloggers.length > 0) {
        onSuccess(parsedBloggers);
      } else {
        onError('엑셀 파일에서 유효한 데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Excel parsing error:', error);
      onError('엑셀 파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  reader.readAsBinaryString(file);
};

