const XLSX = require('xlsx');
const path = require('path');

// 블로거 템플릿 데이터
const data = [
  ['이름', '블로그 URL', '블로그 지수'],
  ['김미영', 'https://blog.naver.com/foodlover_my', 850],
  ['박준호', 'https://blog.naver.com/travel_jun', 920],
  ['이서연', 'https://blog.naver.com/beauty_sy', 780],
  ['최민수', 'https://blog.naver.com/tech_ms', 810],
  ['정수진', 'https://blog.naver.com/daily_sj', 750],
  ['강동혁', 'https://blog.naver.com/sports_dh', 880],
  ['윤하늘', 'https://blog.naver.com/fashion_hn', 795],
  ['한지우', 'https://blog.naver.com/book_jw', 820],
  ['오세훈', 'https://blog.naver.com/movie_sh', 770],
  ['송민지', 'https://blog.naver.com/cooking_mj', 840],
];

// 워크시트 생성
const ws = XLSX.utils.aoa_to_sheet(data);

// 컬럼 너비 설정
ws['!cols'] = [
  { wch: 10 },  // 이름
  { wch: 40 },  // 블로그 URL
  { wch: 12 },  // 블로그 지수
];

// 워크북 생성
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '블로거 목록');

// 파일 저장
const outputPath = path.join(__dirname, '..', '블로거_등록_양식.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ 엑셀 파일이 생성되었습니다!');
console.log(`📁 위치: ${outputPath}`);
console.log(`📊 데이터: ${data.length - 1}명의 블로거 샘플`);
