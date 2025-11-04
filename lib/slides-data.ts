import { Slide } from '@/types/slides';

export const slides: Slide[] = [
  // 1. 시작 페이지
  {
    id: 1,
    type: 'intro',
    title: '애드센스 마케팅 플랫폼',
    subtitle: '사용 설명서',
    content: {
      main: 'B2B 마케팅 상품 접수 및 관리 시스템',
      points: [
        '4가지 전문 마케팅 상품',
        '포인트 기반 간편 결제',
        '실시간 접수 내역 관리',
        '전문적인 데이터 분석'
      ]
    },
    bgColor: 'from-blue-600 to-blue-800'
  },

  // 2. 시스템 소개
  {
    id: 2,
    type: 'feature',
    title: '시스템 개요',
    subtitle: '어떤 서비스인가요?',
    content: {
      main: '마케팅 상품을 온라인으로 주문하고 관리하는 플랫폼입니다',
      points: [
        '💳 포인트로 간편하게 상품 구매',
        '📊 실시간 접수 현황 확인',
        '👥 관리자와 거래처 분리 관리',
        '📈 전문적인 통계 분석 제공'
      ],
      highlight: '마켓에서 쇼핑하듯 쉽고 편리하게!'
    }
  },

  // 3. 4가지 상품 소개
  {
    id: 3,
    type: 'feature',
    title: '제공 상품',
    subtitle: '4가지 전문 마케팅 서비스',
    content: {
      points: [
        '🏪 플레이스 유입 - 네이버 플레이스 방문자 증가',
        '🧾 영수증 리뷰 - 영수증 기반 리뷰 작성',
        '🗺️ 카카오맵 리뷰 - 카카오맵 평점 향상',
        '📝 블로그 배포 - 기업 블로그 홍보 글 작성'
      ],
      highlight: '각 상품은 거래처별 맞춤 가격으로 제공됩니다'
    }
  },

  // 4. 로그인 방법
  {
    id: 4,
    type: 'step-by-step',
    title: '로그인 방법',
    subtitle: '시스템 접속하기',
    content: {
      steps: [
        {
          number: 1,
          title: '로그인 페이지 접속',
          description: '웹 브라우저에서 시스템 주소 입력'
        },
        {
          number: 2,
          title: '사용자 유형 선택',
          description: '관리자 또는 거래처 탭 선택',
          tip: '처음에는 "거래처" 탭이 선택되어 있습니다'
        },
        {
          number: 3,
          title: '로그인 정보 입력',
          description: '아이디와 비밀번호 입력 후 로그인 버튼 클릭'
        },
        {
          number: 4,
          title: '대시보드 확인',
          description: '로그인 성공 시 메인 화면으로 이동'
        }
      ]
    }
  },

  // 5. 관리자 소개
  {
    id: 5,
    type: 'intro',
    title: '관리자 기능',
    subtitle: 'Administrator Features',
    content: {
      main: '비즈니스를 효율적으로 관리하세요',
      points: [
        '👥 거래처 계정 생성 및 전체 관리',
        '💲 거래처별 맞춤 상품 가격 설정',
        '💰 포인트 충전/차감/환불 관리',
        '📋 전체 접수 내역 조회 및 상태 변경',
        '🔧 AS 요청 접수 및 처리',
        '📊 전문적인 데이터 분석 대시보드',
        '📥 엑셀 리포트 자동 생성'
      ]
    },
    bgColor: 'from-purple-600 to-purple-800'
  },

  // 6. 관리자 대시보드
  {
    id: 6,
    type: 'feature',
    title: '관리자 대시보드',
    subtitle: '한눈에 보는 현황',
    content: {
      main: '실시간 통계와 최근 활동을 확인하세요',
      points: [
        '📊 총 거래처 수',
        '⏳ 대기 중인 접수',
        '💰 총 포인트',
        '📦 상품 카테고리 수',
        '🔔 최근 접수 내역 (최근 24시간)',
        '🎯 AS 신청 대기 건수'
      ],
      highlight: '필터 기능으로 대기중 접수만 빠르게 확인!'
    }
  },

  // 7. 거래처 관리
  {
    id: 7,
    type: 'step-by-step',
    title: '거래처 관리',
    subtitle: '거래처 추가하기',
    content: {
      steps: [
        {
          number: 1,
          title: '거래처 추가 버튼 클릭',
          description: '우측 상단의 "거래처 추가" 버튼 클릭'
        },
        {
          number: 2,
          title: '정보 입력',
          description: '아이디, 비밀번호, 회사명, 담당자, 연락처, 이메일 입력',
          tip: '초기 포인트는 선택사항입니다'
        },
        {
          number: 3,
          title: '거래처 추가 완료',
          description: '입력한 정보로 새 거래처 계정 생성'
        },
        {
          number: 4,
          title: '비밀번호 전달',
          description: '생성된 비밀번호를 거래처에게 안전하게 전달',
          tip: '비밀번호는 암호화되어 저장됩니다'
        }
      ]
    }
  },

  // 8. 거래처 관리 기능들
  {
    id: 8,
    type: 'feature',
    title: '거래처 관리 기능',
    subtitle: '다양한 관리 옵션',
    content: {
      points: [
        '✏️ 정보 수정 - 회사명, 담당자, 연락처 변경',
        '🔑 비밀번호 재설정 - 자동 생성 또는 직접 입력',
        '💰 포인트 관리 - 충전, 차감, 환불',
        '💲 상품 가격 설정 - 거래처별 맞춤 가격',
        '🔍 상태 변경 - 활성/비활성 전환',
        '🗑️ 계정 삭제 - 거래처 계정 완전 삭제'
      ],
      highlight: '각 기능은 거래처 목록에서 버튼으로 바로 접근 가능!'
    }
  },

  // 9. 상품 가격 설정
  {
    id: 9,
    type: 'step-by-step',
    title: '상품 가격 설정',
    subtitle: '거래처별 맞춤 가격',
    content: {
      steps: [
        {
          number: 1,
          title: '가격 설정 버튼 클릭',
          description: '거래처 목록에서 "가격 설정" 아이콘 클릭'
        },
        {
          number: 2,
          title: '상품별 가격 입력',
          description: '4가지 상품의 단가를 포인트로 입력',
          tip: '예: 플레이스 유입 = 5000P'
        },
        {
          number: 3,
          title: '노출 여부 설정',
          description: '체크박스로 각 상품의 노출/숨김 선택'
        },
        {
          number: 4,
          title: '저장',
          description: '설정 완료 후 저장 버튼 클릭'
        }
      ],
      highlight: '거래처는 설정된 가격으로만 상품을 볼 수 있습니다'
    }
  },

  // 10. 포인트 관리
  {
    id: 10,
    type: 'feature',
    title: '포인트 관리',
    subtitle: '충전, 차감, 환불',
    content: {
      main: '거래처의 포인트를 관리하세요',
      points: [
        '💳 충전 - 거래처에게 포인트 추가',
        '➖ 차감 - 포인트 차감 (계약 조정 시)',
        '♻️ 환불 - 사용하지 않은 포인트 환불',
        '📊 거래 내역 - 모든 포인트 거래 기록 자동 저장',
        '🔍 필터링 - 거래 유형, 기간별 조회',
        '📈 정렬 - 최신순, 금액순 정렬'
      ],
      highlight: '최대 1조 포인트까지 한 번에 충전 가능!'
    }
  },

  // 11. 접수 내역 관리
  {
    id: 11,
    type: 'feature',
    title: '접수 내역 관리',
    subtitle: '모든 접수를 한눈에',
    content: {
      main: '전체 거래처의 상품 접수 현황을 관리하세요',
      points: [
        '📋 통합 조회 - 4가지 상품 접수 내역 통합',
        '🔄 상태 변경 - 대기중/진행중/완료/취소',
        '👁️ 상세보기 - 거래처 정보, 파일, URL 확인',
        '📥 파일 다운로드 - 업로드된 파일 일괄 다운로드',
        '🔍 고급 필터 - 거래처, 상품, 상태, 기간별 필터',
        '📊 Excel 내보내기 - 리포트 생성'
      ]
    }
  },

  // 12. 접수 상태 변경
  {
    id: 12,
    type: 'step-by-step',
    title: '접수 상태 변경',
    subtitle: '접수 처리하기',
    content: {
      steps: [
        {
          number: 1,
          title: '접수 내역 페이지',
          description: '좌측 메뉴에서 "접수 내역" 클릭'
        },
        {
          number: 2,
          title: '상태 선택',
          description: '각 접수의 상태 드롭다운 클릭',
          tip: '4가지 상태: 대기중, 진행중, 완료, 취소'
        },
        {
          number: 3,
          title: '자동 저장',
          description: '선택한 상태로 즉시 업데이트',
          tip: 'Optimistic UI로 빠른 반응 속도'
        },
        {
          number: 4,
          title: '거래처 확인',
          description: '거래처가 페이지 새로고침 시 변경사항 확인'
        }
      ]
    }
  },

  // 13. AS 요청 관리
  {
    id: 13,
    type: 'feature',
    title: 'AS 요청 관리',
    subtitle: '문제 신청 처리',
    content: {
      main: '거래처의 AS 신청을 처리하세요',
      points: [
        '📋 AS 목록 - 모든 AS 신청 조회',
        '👁️ 상세보기 - 미달 현황, 신청 사유 확인',
        '✅ 처리하기 - 해결 내용 입력 및 상태 변경',
        '📊 대시보드 통계 - 대기 중인 AS 건수 표시',
        '🔍 필터링 - 상태별, 기간별 조회'
      ],
      highlight: '예정 수량과 실제 달성 수량을 자동 계산!'
    }
  },

  // 14. 데이터 분석 대시보드
  {
    id: 14,
    type: 'intro',
    title: '데이터 분석 대시보드',
    subtitle: 'Professional Analytics',
    content: {
      main: '데이터 기반 의사결정을 지원합니다',
      points: [
        '📊 5개 전문 분석 탭 (전체개요/일간/주간/월간/상품)',
        '📈 실시간 증감률 자동 계산 (오늘 vs 어제)',
        '🎯 15개 핵심 KPI 지표 제공',
        '📉 7가지 차트 타입 (라인/바/파이/영역 등)',
        '🔍 기간별 비교 분석 (일/주/월)',
        '🏆 TOP 10 거래처 랭킹',
        '⏰ 시간대별 접수 패턴 분석',
        '💡 평균 처리시간, AS 발생률, 완료율 등'
      ]
    },
    bgColor: 'from-green-600 to-green-800'
  },

  // 15. 데이터 분석 - 전체 개요
  {
    id: 15,
    type: 'feature',
    title: '전체 개요 탭',
    subtitle: 'Dashboard Overview',
    content: {
      main: '비즈니스 현황을 한눈에',
      points: [
        '📊 실시간 KPI (오늘 vs 어제)',
        '📈 최근 30일 접수 추이 차트',
        '🥧 상품별 분포 파이 차트',
        '🏆 TOP 10 거래처 랭킹',
        '💡 주요 지표 (평균 처리 시간, AS 발생률, 완료율)',
        '⏰ 포인트 회전율, 활성 거래처 수'
      ]
    }
  },

  // 16. 데이터 분석 - 기간별
  {
    id: 16,
    type: 'feature',
    title: '기간별 분석',
    subtitle: '일간/주간/월간',
    content: {
      points: [
        '📅 일간 분석 - 오늘 vs 어제 비교, 시간대별 패턴',
        '📊 주간 분석 - 이번 주 vs 지난 주, 최근 12주 추이',
        '📈 월간 분석 - 이번 달 vs 지난 달, 최근 12개월 추이',
        '🎨 Area Chart - 그라데이션 효과',
        '📊 Bar Chart - 명확한 비교',
        '⬆️⬇️ 증감률 아이콘 - 추세 시각화'
      ]
    }
  },

  // 17. 엑셀 리포트
  {
    id: 17,
    type: 'feature',
    title: '엑셀 리포트',
    subtitle: 'Excel Export',
    content: {
      main: '4종 리포트 자동 생성',
      points: [
        '📄 접수 내역 리포트',
        '💰 포인트 거래 리포트',
        '👥 거래처 마스터 리포트',
        '🔧 AS 신청 리포트',
        '📊 통계 시트 자동 추가',
        '🔤 한글 파일명 지원'
      ],
      highlight: '접수 내역 페이지에서 Excel 다운로드 버튼으로 간편하게!'
    }
  },

  // 18. 거래처 기능 소개
  {
    id: 18,
    type: 'intro',
    title: '거래처 기능',
    subtitle: 'Client Features',
    content: {
      main: '쉽고 빠르게 마케팅 상품을 신청하세요',
      points: [
        '🛒 4가지 전문 마케팅 상품 간편 접수',
        '💰 포인트 실시간 확인 및 자동 차감',
        '📋 내 접수 내역 한눈에 조회',
        '🔄 접수 상태 실시간 업데이트',
        '🔧 AS 신청 및 처리 현황 확인',
        '📊 포인트 충전/사용 내역 조회',
        '📱 모바일 완벽 지원',
        '🎯 거래처별 맞춤 가격 적용'
      ]
    },
    bgColor: 'from-orange-600 to-orange-800'
  },

  // 19. 거래처 대시보드
  {
    id: 19,
    type: 'feature',
    title: '거래처 대시보드',
    subtitle: '내 정보 한눈에',
    content: {
      main: '포인트와 이용 현황을 확인하세요',
      points: [
        '💰 현재 포인트 - 큰 글씨로 표시',
        '📊 통계 카드 - 총 접수 건수, 이용 가능 상품',
        '🕐 최근 접수 내역 - 최근 5건 표시',
        '🛒 이용 가능 상품 - 4개 카드로 표시',
        '💲 상품별 단가 - 내 맞춤 가격 표시',
        '✨ 상태 배지 - 대기중/진행중/완료/취소'
      ]
    }
  },

  // 20. 상품 접수하기
  {
    id: 20,
    type: 'step-by-step',
    title: '상품 접수하기',
    subtitle: '플레이스 유입 예시',
    content: {
      steps: [
        {
          number: 1,
          title: '상품 선택',
          description: '대시보드에서 "플레이스 유입" 카드의 접수하기 버튼 클릭'
        },
        {
          number: 2,
          title: '정보 입력',
          description: '업체명, 플레이스 URL, 일일 유입 수, 총 일수 입력',
          tip: '일일 최소 100건, 3-7일 선택 가능'
        },
        {
          number: 3,
          title: '포인트 확인',
          description: '실시간으로 계산된 총 포인트 확인',
          tip: '일일 수량 × 총 일수 × 단가'
        },
        {
          number: 4,
          title: '접수 완료',
          description: '접수하기 버튼 클릭 후 포인트 자동 차감'
        }
      ]
    }
  },

  // 21. 영수증 리뷰 접수
  {
    id: 21,
    type: 'step-by-step',
    title: '영수증 리뷰 접수',
    subtitle: '파일 업로드 포함',
    content: {
      steps: [
        {
          number: 1,
          title: '기본 정보 입력',
          description: '업체명, 플레이스 URL, 일일/총 수량 입력',
          tip: '최소 30건 이상'
        },
        {
          number: 2,
          title: '옵션 선택',
          description: '사진 포함 여부, 스크립트 제공 여부 선택'
        },
        {
          number: 3,
          title: '파일 업로드',
          description: '사업자등록증, 샘플 영수증, 가이드 사진 업로드',
          tip: '필수 파일 업로드 필요!'
        },
        {
          number: 4,
          title: '가이드 텍스트',
          description: '리뷰 작성 가이드 입력 (선택사항)'
        }
      ]
    }
  },

  // 22. 카카오맵/블로그 접수
  {
    id: 22,
    type: 'step-by-step',
    title: '카카오맵 & 블로그 접수',
    subtitle: '나머지 상품 신청 방법',
    content: {
      steps: [
        {
          number: 1,
          title: '카카오맵 리뷰 접수',
          description: '카카오맵 URL, 텍스트/사진 리뷰 개수 입력',
          tip: '스크립트 파일과 사진 업로드 가능'
        },
        {
          number: 2,
          title: '블로그 배포 - 타입 선택',
          description: '3가지 배포 타입 중 선택 (리뷰어/영상/자동화)',
          tip: '각 타입별로 다른 옵션이 제공됩니다'
        },
        {
          number: 3,
          title: '블로그 배포 - 콘텐츠 설정',
          description: '콘텐츠 타입(리뷰/정보) 선택 및 키워드 입력',
          tip: '키워드는 쉼표(,)로 구분하여 입력하세요'
        },
        {
          number: 4,
          title: '파일 업로드 및 접수',
          description: '가이드 텍스트, 사진 업로드 후 접수 완료',
          tip: '포인트는 설정에 따라 자동 계산됩니다'
        }
      ]
    }
  },

  // 23. 접수 내역 조회
  {
    id: 23,
    type: 'feature',
    title: '내 접수 내역',
    subtitle: '신청한 상품 확인',
    content: {
      main: '모든 접수를 한눈에 확인하세요',
      points: [
        '📋 전체 목록 - 날짜순 정렬',
        '🏷️ 상태 배지 - 대기중/진행중/완료/취소',
        '💰 사용 포인트 - 각 접수별 차감 포인트',
        '📅 접수 일시 - 신청한 날짜와 시간',
        '🔄 자동 새로고침 - 페이지 포커스 시 업데이트',
        '📱 반응형 - 모바일에서도 깔끔한 카드 뷰'
      ]
    }
  },

  // 24. 포인트 내역
  {
    id: 24,
    type: 'feature',
    title: '포인트 내역',
    subtitle: '충전과 사용 기록',
    content: {
      main: '모든 포인트 거래를 확인하세요',
      points: [
        '💳 거래 유형 - 충전/차감/환불',
        '💰 거래 금액 - 변동 포인트',
        '📊 잔액 - 거래 후 남은 포인트',
        '📝 설명 - 거래 사유',
        '📅 거래 일시 - 정확한 시간 기록',
        '🔍 참조 정보 - 연관된 접수 ID'
      ]
    }
  },

  // 25. AS 신청하기
  {
    id: 25,
    type: 'step-by-step',
    title: 'AS 신청하기',
    subtitle: '문제 발생 시',
    content: {
      steps: [
        {
          number: 1,
          title: '완료된 접수 선택',
          description: '드롭다운에서 AS 신청할 접수 선택',
          tip: '완료 상태인 접수만 표시됩니다'
        },
        {
          number: 2,
          title: '자동 정보 입력',
          description: '상품 유형, 예정 수량 자동 채워짐'
        },
        {
          number: 3,
          title: '실제 달성 수량 입력',
          description: '실제로 달성된 수량 입력',
          tip: '미달 수량이 자동 계산됩니다'
        },
        {
          number: 4,
          title: 'AS 사유 작성',
          description: '문제 상황을 상세히 설명'
        }
      ],
      highlight: '관리자가 검토 후 처리해드립니다!'
    }
  },

  // 26. 모바일 사용
  {
    id: 26,
    type: 'feature',
    title: '모바일 지원',
    subtitle: 'Responsive Design',
    content: {
      main: '언제 어디서나 편리하게',
      points: [
        '📱 완벽한 반응형 - 모든 화면 크기 지원',
        '🍔 햄버거 메뉴 - 관리자 모바일 네비게이션',
        '🎴 카드 레이아웃 - 테이블이 카드로 전환',
        '↔️ 가로 스크롤 - 필터 영역 최적화',
        '📏 텍스트 조정 - 화면 크기별 자동 조정',
        '👆 터치 최적화 - 버튼 크기 32px 이상'
      ]
    }
  },

  // 27. 보안 및 권한
  {
    id: 27,
    type: 'feature',
    title: '보안 시스템',
    subtitle: 'Security & Permissions',
    content: {
      main: '안전하게 보호되는 정보',
      points: [
        '🔐 비밀번호 암호화 - bcrypt 해싱 (salt rounds: 10)',
        '🍪 세션 관리 - Cookie 기반 24시간 유효',
        '🔒 자동 로그아웃 - 세션 만료 시',
        '🚫 권한 분리 - 관리자/거래처 엄격 구분',
        '🛡️ 미들웨어 보호 - 모든 페이지 접근 검증',
        '🔑 비밀번호 재설정 - 관리자 권한 필요'
      ]
    }
  },

  // 28. 주요 팁
  {
    id: 28,
    type: 'feature',
    title: '사용 팁',
    subtitle: 'Pro Tips',
    content: {
      main: '더 효율적으로 사용하기',
      points: [
        '💡 필터 활용 - 원하는 데이터 빠르게 찾기',
        '📊 Excel 다운로드 - 오프라인 분석',
        '🔍 검색 기능 - 통합 검색으로 빠른 조회',
        '⌨️ 키보드 단축키 - 화살표로 슬라이드 이동',
        '🔄 자동 새로고침 - 페이지 포커스 시 최신 데이터',
        '📱 모바일 접속 - 언제 어디서나 관리'
      ]
    }
  },

  // 29. 문제 해결
  {
    id: 29,
    type: 'step-by-step',
    title: '자주 묻는 질문',
    subtitle: 'FAQ & Troubleshooting',
    content: {
      steps: [
        {
          number: 1,
          title: '로그인이 안 돼요',
          description: '아이디/비밀번호를 확인하고, 문제가 계속되면 관리자에게 비밀번호 재설정을 요청하세요.',
          tip: '대소문자와 공백을 주의하세요'
        },
        {
          number: 2,
          title: '포인트가 부족해요',
          description: '관리자에게 포인트 충전을 요청하세요. 한 번에 최대 1조 포인트까지 충전 가능합니다.',
          tip: '포인트 내역 페이지에서 사용 현황 확인'
        },
        {
          number: 3,
          title: '접수 상태가 변경 안 돼요',
          description: '페이지를 새로고침(F5)하거나, 관리자가 상태를 변경할 때까지 기다려주세요.',
          tip: '페이지 포커스 시 자동 새로고침됩니다'
        },
        {
          number: 4,
          title: '파일 업로드가 실패해요',
          description: '파일 형식(JPG, PNG), 파일 크기, 인터넷 연결 상태를 확인해주세요.',
          tip: '파일 크기는 10MB 이하 권장'
        }
      ],
      highlight: '문제가 해결되지 않으면 관리자에게 문의하세요!'
    }
  },

  // 30. 마무리
  {
    id: 30,
    type: 'intro',
    title: '이용해주셔서 감사합니다',
    subtitle: 'Thank You for Using',
    content: {
      main: '애드센스 마케팅 플랫폼과 함께 성장하세요',
      points: [
        '📞 문의사항 - 관리자에게 언제든 연락하세요',
        '🔧 AS 신청 - 시스템 내에서 간편하게 신청 가능',
        '📊 데이터 분석 - 실시간 통계로 비즈니스 인사이트 확보',
        '📱 모바일 지원 - 언제 어디서나 접속 가능',
        '🔐 안전한 보안 - 암호화된 비밀번호와 세션 관리',
        '💡 지속적인 업데이트 - 더 나은 서비스 제공',
        '🎯 맞춤형 가격 - 거래처별 최적화된 단가',
        '🚀 빠른 처리 - 실시간 접수 및 상태 관리'
      ],
      highlight: '성공적인 마케팅을 응원합니다! 🎉'
    },
    bgColor: 'from-indigo-600 to-indigo-800'
  }
];

