import * as XLSX from 'xlsx';
import type { CategoryType, ProductType } from '../types';
import { CATEGORY_TEMPLATE_NAME } from '../constants';

// 시트 열 너비 설정 헬퍼
const setColumnWidths = (worksheet: XLSX.WorkSheet, widths: number[]) => {
  worksheet['!cols'] = widths.map((wch) => ({ wch }));
};

// K맵 리뷰 시트 생성
export function createKakaomapSheet(): XLSX.WorkSheet {
  const data = [
    ['접수번호', '업체명', '리뷰원고', '리뷰등록날짜', '영수증날짜', '상태', '리뷰링크', '리뷰아이디'],
    [
      'KM-2025-0001',
      '맛있는식당',
      '음식이 정말 맛있고 친절해요! 분위기도 좋아서 다음에 또 올게요~',
      '2025-12-05',
      '2025-12-01',
      '승인됨',
      'https://place.map.kakao.com/review/123456',
      'review_123456',
    ],
    [
      'KM-2025-0001',
      '맛있는식당',
      '가격 대비 양이 푸짐하고 맛도 좋습니다. 주차도 편해요.',
      '2025-12-06',
      '2025-12-02',
      '승인됨',
      'https://place.map.kakao.com/review/123457',
      'review_123457',
    ],
    [
      'KM-2025-0002',
      '카페블루',
      '직원분들이 너무 친절하시고 서비스가 좋았어요!',
      '2025-12-05',
      '2025-11-28',
      '대기',
      '',
      '',
    ],
    [
      'KM-2025-0002',
      '카페블루',
      '분위기 좋고 커피도 맛있어요. 재방문 의사 100%!',
      '2025-12-06',
      '2025-11-30',
      '대기',
      '',
      '',
    ],
    [
      'KM-2025-0003',
      '(주)맛집마케팅',
      '깔끔한 인테리어와 맛있는 음식 추천합니다!',
      '2025-12-07',
      '2025-12-03',
      '수정요청',
      'https://place.map.kakao.com/review/123458',
      'review_123458',
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [18, 20, 60, 14, 14, 10, 45, 18]);
  return ws;
}

// 방문자 리뷰 시트 생성
export function createReceiptSheet(): XLSX.WorkSheet {
  const data = [
    ['접수번호', '업체명', '리뷰원고', '리뷰등록날짜', '영수증날짜', '상태', '리뷰링크', '리뷰아이디'],
    [
      'RR-2025-0001',
      '맛있는식당',
      '음식이 정말 맛있어요! 사장님도 친절하시고 분위기 좋아서 재방문 의사 100%입니다.',
      '2025-12-05',
      '2025-12-01',
      '승인됨',
      'https://naver.me/review/123456',
      'naver_123456',
    ],
    [
      'RR-2025-0001',
      '맛있는식당',
      '점심 특선 메뉴가 가성비 최고예요. 직장인들한테 강추합니다!',
      '2025-12-06',
      '2025-12-02',
      '승인됨',
      'https://naver.me/review/123457',
      'naver_123457',
    ],
    [
      'RR-2025-0002',
      '커피전문점',
      '디저트가 정말 맛있고 커피도 퀄리티가 좋아요. 인테리어도 예쁘네요~',
      '2025-12-05',
      '2025-11-28',
      '대기',
      '',
      '',
    ],
    [
      'RR-2025-0002',
      '커피전문점',
      '브런치 세트 강추! 가격 대비 퀄리티 좋고 직원분들도 친절합니다.',
      '2025-12-06',
      '2025-11-30',
      '대기',
      '',
      '',
    ],
    [
      'RR-2025-0003',
      '(주)카페마케팅',
      '분위기 좋고 음료도 맛있어요. 주차도 편해서 자주 올 것 같아요!',
      '2025-12-07',
      '2025-12-03',
      '수정요청',
      'https://naver.me/review/123458',
      'naver_123458',
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [18, 20, 60, 14, 14, 10, 45, 18]);
  return ws;
}

// 리뷰어 배포 시트 생성
export function createBlogReviewerSheet(): XLSX.WorkSheet {
  const data = [
    ['접수번호', '업체명', '작성제목', '발행일', '상태', '블로그링크', '블로그아이디'],
    [
      'BD-2025-0001',
      '뷰티샵',
      '강남 맛집 추천! 진짜 맛있는 곳',
      '2025-12-05',
      '승인됨',
      'https://blog.naver.com/reviewer1/123456',
      'post_123456',
    ],
    [
      'BD-2025-0001',
      '뷰티샵',
      '분위기 좋은 카페 후기',
      '2025-12-06',
      '승인됨',
      'https://blog.naver.com/reviewer2/123457',
      'post_123457',
    ],
    ['BD-2025-0002', '헤어샵', '머리하러 갔다가 대박 발견!', '2025-12-07', '대기', '', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [18, 20, 40, 14, 10, 45, 18]);
  return ws;
}

// 영상 배포 시트 생성
export function createBlogVideoSheet(): XLSX.WorkSheet {
  const data = [
    ['접수번호', '업체명', '작성제목', '발행일', '상태', '블로그링크', '블로그아이디'],
    [
      'BD-2025-0003',
      '음식점',
      '맛집 브이로그 | 진짜 맛있다',
      '2025-12-05',
      '승인됨',
      'https://blog.naver.com/video1/234567',
      'video_234567',
    ],
    ['BD-2025-0003', '음식점', '먹방 유튜버의 솔직 후기', '2025-12-06', '대기', '', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [18, 20, 40, 14, 10, 45, 18]);
  return ws;
}

// 자동화 배포 시트 생성
export function createBlogAutomationSheet(): XLSX.WorkSheet {
  const data = [
    ['접수번호', '업체명', '작성제목', '발행일', '상태', '블로그링크', '블로그아이디'],
    [
      'BD-2025-0004',
      '네일샵',
      '자동 생성 포스팅 #1',
      '2025-12-05',
      '승인됨',
      'https://blog.naver.com/auto1/345678',
      'auto_345678',
    ],
    [
      'BD-2025-0004',
      '네일샵',
      '자동 생성 포스팅 #2',
      '2025-12-06',
      '승인됨',
      'https://blog.naver.com/auto2/345679',
      'auto_345679',
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [18, 20, 40, 14, 10, 45, 18]);
  return ws;
}

// 카페 침투 시트 생성
export function createCafeSheet(): XLSX.WorkSheet {
  const data = [
    ['접수번호', '업체명', '작성제목', '발행일', '상태', '리뷰링크', '작성아이디', '카페명'],
    [
      'CM-2025-0001',
      '네일샵',
      '예쁜 네일 추천합니다!',
      '2025-12-05',
      '승인됨',
      'https://cafe.naver.com/xxx/123456',
      'nail_lover',
      '뷰티카페',
    ],
    [
      'CM-2025-0001',
      '네일샵',
      '네일아트 후기 공유해요',
      '2025-12-06',
      '승인됨',
      'https://cafe.naver.com/yyy/123457',
      'beauty_queen',
      '셀프네일',
    ],
    ['CM-2025-0002', '헤어샵', '염색 전문점 방문 후기', '2025-12-07', '대기', '', '', '헤어스타일'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [18, 20, 40, 14, 10, 45, 18, 15]);
  return ws;
}

// 커뮤니티 마케팅 시트 생성
export function createCommunitySheet(): XLSX.WorkSheet {
  const data = [
    ['접수번호', '업체명', '작성제목', '발행일', '상태', '리뷰링크', '작성아이디', '카페명'],
    [
      'CM-2025-0003',
      '뷰티샵',
      '커뮤니티 홍보 게시글',
      '2025-12-05',
      '승인됨',
      'https://www.clien.net/service/board/park/12345678',
      'beauty_pro',
      '클리앙 공원',
    ],
    [
      'CM-2025-0003',
      '뷰티샵',
      '추천 맛집 정보 공유',
      '2025-12-06',
      '승인됨',
      'https://www.ppomppu.co.kr/zboard/view.php?id=12345',
      'foodie_lover',
      '뽐뿌 자유게시판',
    ],
    ['CM-2025-0004', '헤어샵', '헤어샵 후기 공유', '2025-12-07', '대기', '', '', '82쿡'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  setColumnWidths(ws, [18, 20, 40, 14, 10, 45, 18, 15]);
  return ws;
}

// 사용법 시트 생성
export function createGuideSheet(allowedProducts: ProductType[]): XLSX.WorkSheet {
  const guideData: (string | number)[][] = [
    ['📌 데이터 업로드 가이드'],
    [''],
    ['■ 접수번호 형식'],
  ];

  if (allowedProducts.includes('kakaomap')) {
    guideData.push(['  - K맵 리뷰: KM-2025-0001']);
  }
  if (allowedProducts.includes('receipt')) {
    guideData.push(['  - 방문자 리뷰: RR-2025-0001']);
  }
  if (
    allowedProducts.includes('blog_reviewer') ||
    allowedProducts.includes('blog_video') ||
    allowedProducts.includes('blog_automation')
  ) {
    guideData.push(['  - 블로그 배포 (리뷰어/영상/자동화): BD-2025-0001']);
  }
  if (allowedProducts.includes('cafe')) {
    guideData.push(['  - 카페 침투: CM-2025-0001']);
  }
  if (allowedProducts.includes('community')) {
    guideData.push(['  - 커뮤니티 마케팅: CM-2025-0001']);
  }

  guideData.push([''], ['■ 날짜 형식'], ['  - YYYY-MM-DD (예: 2025-12-01)'], ['']);

  // K맵 전용 안내
  if (allowedProducts.includes('kakaomap')) {
    guideData.push(
      ['■ K맵 리뷰 시트 (리뷰 콘텐츠 관리)'],
      ['  - 접수번호: 해당 접수의 접수번호'],
      ['  - 리뷰원고: 카카오맵에 등록할/등록한 리뷰 내용'],
      ['  - 리뷰등록날짜: 카카오맵에 실제 리뷰가 등록된 날짜'],
      ['  - 영수증날짜: 영수증에 표시된 방문 날짜'],
      ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
      ['  - 리뷰링크: 카카오맵 리뷰 URL (선택)'],
      ['  - 리뷰아이디: 카카오맵 리뷰 고유 ID (선택)'],
      ['']
    );
  }

  // 방문자 리뷰 전용 안내
  if (allowedProducts.includes('receipt')) {
    guideData.push(
      ['■ 방문자 리뷰 시트 (네이버 리뷰) - K맵과 동일한 형식'],
      ['  - 접수번호: 해당 접수의 접수번호'],
      ['  - 리뷰원고: 네이버에 등록할/등록한 리뷰 내용'],
      ['  - 리뷰등록날짜: 네이버에 실제 리뷰가 등록된 날짜'],
      ['  - 영수증날짜: 영수증에 표시된 방문 날짜'],
      ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
      ['  - 리뷰링크: 네이버 리뷰 URL (선택)'],
      ['  - 리뷰아이디: 네이버 리뷰 고유 ID (선택)'],
      ['']
    );
  }

  // 블로그 배포 전용 안내 (3개 시트 공통)
  if (
    allowedProducts.includes('blog_reviewer') ||
    allowedProducts.includes('blog_video') ||
    allowedProducts.includes('blog_automation')
  ) {
    guideData.push(
      ['■ 블로그 배포 시트 (리뷰어/영상/자동화 배포)'],
      ['  - 접수번호: 해당 접수의 접수번호 (BD-YYYY-XXXX)'],
      ['  - 업체명: 업체명 (참고용, DB 기준 자동 매칭)'],
      ['  - 작성제목: 블로그 포스팅 제목'],
      ['  - 발행일: 블로그에 실제 발행된 날짜 (YYYY-MM-DD)'],
      ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
      ['  - 블로그링크: 블로그 포스팅 URL (선택)'],
      ['  - 블로그아이디: 블로그 포스팅 고유 ID (선택)'],
      [''],
      ['  ※ 시트별 구분: 리뷰어배포, 영상배포, 자동화배포'],
      ['']
    );
  }

  // 카페 침투 전용 안내
  if (allowedProducts.includes('cafe')) {
    guideData.push(
      ['■ 카페 침투 시트 (카페 콘텐츠 관리)'],
      ['  - 접수번호: 해당 접수의 접수번호 (CM-YYYY-XXXX)'],
      ['  - 업체명: 업체명 (참고용, DB 기준 자동 매칭)'],
      ['  - 작성제목: 카페 게시글 제목'],
      ['  - 발행일: 카페에 실제 발행된 날짜 (YYYY-MM-DD)'],
      ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
      ['  - 리뷰링크: 카페 게시글 URL (선택)'],
      ['  - 작성아이디: 카페 작성자 ID (선택)'],
      ['  - 카페명: 게시된 카페 이름 (선택)'],
      ['']
    );
  }

  // 커뮤니티 마케팅 전용 안내
  if (allowedProducts.includes('community')) {
    guideData.push(
      ['■ 커뮤니티 마케팅 시트 (커뮤니티 콘텐츠 관리)'],
      ['  - 접수번호: 해당 접수의 접수번호 (CM-YYYY-XXXX)'],
      ['  - 업체명: 업체명 (참고용, DB 기준 자동 매칭)'],
      ['  - 작성제목: 커뮤니티 게시글 제목'],
      ['  - 발행일: 커뮤니티에 실제 발행된 날짜 (YYYY-MM-DD)'],
      ['  - 상태: 대기, 승인됨, 수정요청 중 선택'],
      ['  - 리뷰링크: 커뮤니티 게시글 URL (선택)'],
      ['  - 작성아이디: 커뮤니티 작성자 ID (선택)'],
      ['  - 카페명: 게시된 커뮤니티 이름 (선택)'],
      ['']
    );
  }

  guideData.push(
    ['■ 중복 처리'],
    ['  - 동일 접수번호 + 동일 날짜 = 기존 데이터 업데이트'],
    ['  - 새로운 날짜 = 신규 데이터 추가'],
    [''],
    ['■ 주의사항'],
    ['  - 접수번호는 DB에 존재해야 합니다'],
    ['  - 업체명은 참고용 (DB 기준 자동 매칭)']
  );

  const ws = XLSX.utils.aoa_to_sheet(guideData);
  ws['!cols'] = [{ wch: 50 }];
  return ws;
}

// 메인 템플릿 다운로드 함수
export function downloadTemplate(category: CategoryType, allowedProducts: ProductType[]) {
  const wb = XLSX.utils.book_new();

  // 각 상품별 시트 추가
  if (allowedProducts.includes('kakaomap')) {
    XLSX.utils.book_append_sheet(wb, createKakaomapSheet(), 'K맵리뷰');
  }

  if (allowedProducts.includes('receipt')) {
    XLSX.utils.book_append_sheet(wb, createReceiptSheet(), '방문자리뷰');
  }

  if (allowedProducts.includes('blog_reviewer')) {
    XLSX.utils.book_append_sheet(wb, createBlogReviewerSheet(), '리뷰어배포');
  }

  if (allowedProducts.includes('blog_video')) {
    XLSX.utils.book_append_sheet(wb, createBlogVideoSheet(), '영상배포');
  }

  if (allowedProducts.includes('blog_automation')) {
    XLSX.utils.book_append_sheet(wb, createBlogAutomationSheet(), '자동화배포');
  }

  if (allowedProducts.includes('cafe')) {
    XLSX.utils.book_append_sheet(wb, createCafeSheet(), '카페침투');
  }

  if (allowedProducts.includes('community')) {
    XLSX.utils.book_append_sheet(wb, createCommunitySheet(), '커뮤니티마케팅');
  }

  // 사용법 시트 추가
  XLSX.utils.book_append_sheet(wb, createGuideSheet(allowedProducts), '사용법');

  // 파일 다운로드
  XLSX.writeFile(wb, CATEGORY_TEMPLATE_NAME[category]);
}
