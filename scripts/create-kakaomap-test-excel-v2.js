const ExcelJS = require('exceljs');
const path = require('path');
const https = require('https');

// 온라인 이미지 다운로드
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function createTestExcelWithImages() {
  console.log('📦 실제 이미지가 포함된 K맵 리뷰 테스트 엑셀 생성 중...\n');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('K맵 리뷰 테스트');

  // 헤더 추가
  worksheet.getRow(1).values = ['순번', '리뷰 원고'];
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 컬럼 너비 설정
  worksheet.getColumn(1).width = 10;
  worksheet.getColumn(2).width = 70;

  // 테스트 데이터
  const reviews = [
    '정말 맛있는 음식점이에요! 음식이 신선하고 양도 푸짐해서 만족스러웠습니다. 재방문 의사 100%입니다.',
    '분위기가 너무 좋고 음식도 훌륭했어요. 직원분들도 친절하시고 서비스가 최고였습니다!',
    '가성비 최고의 맛집! 가격 대비 퀄리티가 정말 좋습니다. 친구들에게 추천하고 싶어요.',
    '깔끔하고 위생적인 매장이에요. 음식 맛도 일품이고 재료가 신선한 게 느껴집니다.',
    '가족과 함께 방문했는데 모두 만족했어요. 특히 메인 메뉴가 정말 맛있었습니다.',
  ];

  // placeholder.com 이미지 URL (다양한 색상)
  const imageUrls = [
    'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Food+1',
    'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Food+2',
    'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Food+3',
    'https://via.placeholder.com/300x200/FFA07A/FFFFFF?text=Food+4',
    'https://via.placeholder.com/300x200/98D8C8/FFFFFF?text=Food+5',
  ];

  // 이미지 다운로드 및 추가
  console.log('🖼️  이미지 다운로드 중...');
  const imageBuffers = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      console.log(`  ${i + 1}/5 다운로드 중...`);
      const buffer = await downloadImage(imageUrls[i]);
      imageBuffers.push(buffer);
    } catch (error) {
      console.log(`  ${i + 1}/5 실패 (무시됨)`);
      imageBuffers.push(null);
    }
  }

  console.log('\n📝 엑셀 데이터 생성 중...');

  // 각 리뷰 행 추가
  for (let i = 0; i < reviews.length; i++) {
    const rowNumber = i + 2; // 헤더 다음부터
    const row = worksheet.getRow(rowNumber);

    row.values = [i + 1, reviews[i]];
    row.height = 100; // 행 높이 설정 (이미지를 위해)
    row.alignment = { vertical: 'middle', wrapText: true };

    // 이미지 추가
    if (imageBuffers[i]) {
      try {
        const imageId = workbook.addImage({
          buffer: imageBuffers[i],
          extension: 'png',
        });

        // 이미지를 A열(순번 옆)에 배치
        worksheet.addImage(imageId, {
          tl: { col: 0.05, row: rowNumber - 1 + 0.05 },
          br: { col: 0.95, row: rowNumber - 1 + 0.95 },
          editAs: 'oneCell',
        });
      } catch (error) {
        console.log(`  이미지 ${i + 1} 추가 중 에러 (무시됨)`);
      }
    }
  }

  // 파일 저장
  const filePath = path.join(process.cwd(), 'K맵_리뷰_테스트_데이터_v2.xlsx');
  await workbook.xlsx.writeFile(filePath);

  console.log('\n✅ 테스트 엑셀 파일 생성 완료!');
  console.log(`📁 위치: ${filePath}`);
  console.log(`\n📋 내용:`);
  console.log(`  - ${reviews.length}개의 리뷰 원고 (B열)`);
  console.log(`  - ${imageBuffers.filter(b => b).length}개의 실제 이미지 (A열)`);
  console.log(`  - 각 행 높이: 100px (이미지가 잘 보이도록)`);
  console.log(`\n🎨 이미지:`);
  console.log(`  - 300x200 크기의 컬러 placeholder 이미지`);
  console.log(`  - 각 행마다 다른 색상`);
  console.log(`\n🧪 테스트 방법:`);
  console.log(`  1. 생성된 엑셀 파일 열기`);
  console.log(`  2. 이미지가 A열에 표시되는지 확인`);
  console.log(`  3. 관리자 페이지 → "콘텐츠 관리" 탭`);
  console.log(`  4. "엑셀 일괄 업로드"로 파일 업로드`);
  console.log(`  5. 미리보기에서 이미지 + 원고 확인`);
}

// 실행
createTestExcelWithImages().catch((error) => {
  console.error('\n❌ 에러 발생:', error.message);
  console.log('\n💡 수동으로 이미지 추가 방법:');
  console.log('  1. 생성된 엑셀 파일 열기');
  console.log('  2. 각 행의 A열에 이미지를 삽입 → 그림 → 이 디바이스');
  console.log('  3. 음식 사진 선택하여 삽입');
  console.log('  4. 이미지 크기를 행에 맞게 조절');
});
