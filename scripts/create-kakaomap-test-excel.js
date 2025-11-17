const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// 간단한 색상 이미지 생성 (1x1 PNG를 확장)
function createColorImage(color) {
  // 1x1 픽셀 PNG 이미지 (base64)
  const colorImages = {
    red: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'),
    blue: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==', 'base64'),
    green: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==', 'base64'),
    yellow: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64'),
    purple: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwnwAFBAIAXPn/xgAAAABJRU5ErkJggg==', 'base64'),
  };
  return colorImages[color] || colorImages.red;
}

// 더 실제적인 테스트 이미지 생성 (200x150 크기의 색상 블록)
function createTestImage(width, height, r, g, b) {
  // PNG 헤더와 IDAT 청크를 포함한 간단한 PNG 생성
  const png = Buffer.alloc(8 + 12 + 13 + 12 + (height * (1 + width * 3)) + 12);

  // PNG 시그니처
  png.write('\x89PNG\r\n\x1a\n', 0);

  // IHDR 청크
  let offset = 8;
  png.writeUInt32BE(13, offset); offset += 4; // 길이
  png.write('IHDR', offset); offset += 4;
  png.writeUInt32BE(width, offset); offset += 4;
  png.writeUInt32BE(height, offset); offset += 4;
  png.writeUInt8(8, offset++); // bit depth
  png.writeUInt8(2, offset++); // color type (RGB)
  png.writeUInt8(0, offset++); // compression
  png.writeUInt8(0, offset++); // filter
  png.writeUInt8(0, offset++); // interlace

  // 단순화를 위해 작은 이미지 사용
  // 실제로는 pngjs나 sharp를 사용하는 것이 좋지만, 테스트용으로는 base64 이미지 사용

  // 대신 실제 이미지 URL에서 다운로드하거나, placeholder 사용
  return null; // null이면 아래에서 placeholder.com 사용
}

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('K맵 리뷰 테스트');

  // 헤더 추가
  worksheet.getRow(1).values = ['순번', '리뷰 원고'];
  worksheet.getRow(1).font = { bold: true };

  // 컬럼 너비 설정
  worksheet.getColumn(1).width = 10;
  worksheet.getColumn(2).width = 60;

  // 테스트 데이터
  const reviews = [
    '정말 맛있는 음식점이에요! 음식이 신선하고 양도 푸짐해서 만족스러웠습니다. 재방문 의사 100%입니다.',
    '분위기가 너무 좋고 음식도 훌륭했어요. 직원분들도 친절하시고 서비스가 최고였습니다!',
    '가성비 최고의 맛집! 가격 대비 퀄리티가 정말 좋습니다. 친구들에게 추천하고 싶어요.',
    '깔끔하고 위생적인 매장이에요. 음식 맛도 일품이고 재료가 신선한 게 느껴집니다.',
    '가족과 함께 방문했는데 모두 만족했어요. 특히 메인 메뉴가 정말 맛있었습니다.',
  ];

  // 온라인 placeholder 이미지 사용 (실제 이미지 다운로드)
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8'];

  // 각 리뷰 행 추가
  for (let i = 0; i < reviews.length; i++) {
    const rowNumber = i + 2; // 헤더 다음부터
    const row = worksheet.getRow(rowNumber);

    row.values = [i + 1, reviews[i]];
    row.height = 80; // 행 높이 설정 (이미지를 위해)

    // 이미지 추가 - placeholder 이미지 생성
    // 200x150 크기의 색상 이미지
    try {
      // 간단한 1x1 PNG를 확장해서 사용
      const color = colors[i % colors.length];

      // ExcelJS는 이미지를 buffer나 base64로 추가할 수 있음
      // 여기서는 간단한 색상 PNG 사용
      const imageBuffer = createColorImage(['red', 'blue', 'green', 'yellow', 'purple'][i % 5]);

      const imageId = workbook.addImage({
        buffer: imageBuffer,
        extension: 'png',
      });

      worksheet.addImage(imageId, {
        tl: { col: 0.1, row: rowNumber - 1 + 0.1 },
        ext: { width: 100, height: 75 },
        editAs: 'oneCell',
      });
    } catch (error) {
      console.log(`이미지 ${i + 1} 추가 중 에러 (무시됨):`, error.message);
    }
  }

  // 파일 저장
  const filePath = path.join(process.cwd(), 'K맵_리뷰_테스트_데이터.xlsx');
  await workbook.xlsx.writeFile(filePath);

  console.log(`✅ 테스트 엑셀 파일 생성 완료!`);
  console.log(`📁 위치: ${filePath}`);
  console.log(`\n📋 내용:`);
  console.log(`- ${reviews.length}개의 리뷰 원고`);
  console.log(`- 각 행에 색상 이미지 포함`);
  console.log(`\n🧪 테스트 방법:`);
  console.log(`1. 관리자 로그인`);
  console.log(`2. K맵 리뷰 관리 → 접수 건 선택`);
  console.log(`3. "콘텐츠 관리" 탭 → "엑셀 일괄 업로드"`);
  console.log(`4. 생성된 파일 업로드`);
}

// 실행
createTestExcel().catch(console.error);
