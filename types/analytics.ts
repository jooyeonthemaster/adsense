// 분석 및 통계 관련 타입 정의

export interface KPIMetrics {
  totalClients: number;
  activeClients: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  completedSubmissions: number;
  cancelledSubmissions: number;
  totalPointsIssued: number;
  totalPointsUsed: number;
  totalPointsBalance: number;
  pendingASRequests: number;
}

export interface ProductStats {
  type: 'place' | 'receipt' | 'kakaomap' | 'blog';
  count: number;
  totalPoints: number;
  avgPoints: number;
  completionRate: number;
}

export interface PeriodStats {
  date: string;
  count: number;
  points: number;
}

export interface ClientRanking {
  clientId: string;
  companyName: string;
  submissionCount: number;
  totalPoints: number;
  lastSubmissionDate: string;
}

export interface DashboardStats {
  kpi: KPIMetrics;
  productStats: ProductStats[];
  dailyStats: PeriodStats[];
  weeklyStats: PeriodStats[];
  monthlyStats: PeriodStats[];
  topClientsBySubmissions: ClientRanking[];
  topClientsByPoints: ClientRanking[];
}

export interface FilterOptions {
  // 날짜 필터
  dateRange?: {
    start: string; // ISO string
    end: string;
    field?: 'created_at' | 'updated_at' | 'start_date';
  };

  // 상태 필터
  status?: ('pending' | 'approved' | 'completed' | 'cancelled')[];

  // 거래처 필터
  clientIds?: string[];

  // 상품 타입 필터
  submissionTypes?: ('place' | 'receipt' | 'kakaomap' | 'blog')[];

  // 포인트 범위 필터
  pointRange?: {
    min: number;
    max: number;
  };

  // 정렬
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };

  // 페이지네이션
  pagination?: {
    page: number;
    limit: number;
  };

  // 검색
  search?: {
    query: string;
    fields: string[];
  };
}

export interface InsightMetrics {
  avgProcessingDays: number;
  completionRateByType: {
    type: string;
    rate: number;
  }[];
  asRequestRate: number;
  pointTurnoverRate: number;
}

export interface HourlyPattern {
  hour: number;
  count: number;
}

export interface ClientROI {
  clientId: string;
  companyName: string;
  totalInvested: number;
  completedCount: number;
  successRate: number;
}
