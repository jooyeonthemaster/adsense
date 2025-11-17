const ExcelJS = require('exceljs');
const path = require('path');

async function createSimpleTestExcel() {
  console.log('📝 간단한 K맵 리뷰 테스트 엑셀 생성 중...\n');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('K맵 리뷰');

  // 헤더
  worksheet.getRow(1).values = ['순번', '리뷰 원고'];
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 컬럼 너비
  worksheet.getColumn(1).width = 10;
  worksheet.getColumn(2).width = 70;

  // 테스트 리뷰 데이터
  const reviews = [
    '정말 맛있는 음식점이에요! 음식이 신선하고 양도 푸짐해서 만족스러웠습니다. 재방문 의사 100%입니다.',
    '분위기가 너무 좋고 음식도 훌륭했어요. 직원분들도 친절하시고 서비스가 최고였습니다!',
    '가성비 최고의 맛집! 가격 대비 퀄리티가 정말 좋습니다. 친구들에게 추천하고 싶어요.',
    '깔끔하고 위생적인 매장이에요. 음식 맛도 일품이고 재료가 신선한 게 느껴집니다.',
    '가족과 함께 방문했는데 모두 만족했어요. 특히 메인 메뉴가 정말 맛있었습니다.',
    '인테리어가 세련되고 깔끔해요. 데이트 장소로도 추천합니다!',
    '주차 공간도 넓고 접근성이 좋아요. 음식 맛은 말할 것도 없이 훌륭합니다.',
    '사장님이 정말 친절하시고 음식에 대한 설명도 자세히 해주셔서 좋았어요.',
  ];

  // 데이터 행 추가
  reviews.forEach((review, i) => {
    const row = worksheet.getRow(i + 2);
    row.values = [i + 1, review];
    row.alignment = { vertical: 'middle', wrapText: true };
    row.height = 50;
  });

  // 파일 저장
  const filePath = path.join(process.cwd(), 'K맵_리뷰_원고만.xlsx');
  await workbook.xlsx.writeFile(filePath);

  console.log('✅ 테스트 엑셀 파일 생성 완료!');
  console.log(`📁 위치: ${filePath}\n`);
  console.log('📋 내용:');
  console.log(`  - ${reviews.length}개의 리뷰 원고`);
  console.log('  - 이미지 없음 (원고만)\n');
  console.log('🧪 사용 방법:');
  console.log('  1. 관리자 페이지 → "콘텐츠 관리" 탭');
  console.log('  2. "엑셀 일괄 업로드" → 이 파일 선택');
  console.log('  3. 미리보기에서 원고 확인');
  console.log('  4. 업로드 → 원고만 있는 콘텐츠 생성됨');
  console.log('  5. "개별 업로드"로 이미지 추가 (선택사항)\n');
}

createSimpleTestExcel().catch(console.error);
