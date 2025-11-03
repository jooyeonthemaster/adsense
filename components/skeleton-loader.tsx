import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 세련된 스켈레톤 로더 컴포넌트
 */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* 헤더 스켈레톤 */}
      <div>
        <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg w-96 mb-2"></div>
        <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-64"></div>
      </div>

      {/* 탭 스켈레톤 */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-10 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-md w-24"
          ></div>
        ))}
      </div>

      {/* KPI 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 추가 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 차트 스켈레톤 */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-64"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg"></div>
        </CardContent>
      </Card>

      {/* 2열 차트 스켈레톤 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-lg"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 인사이트 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded w-12"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * 세련된 프로그레스 바 로더
 */
export function ProgressLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-6 p-8">
        {/* 애니메이션 아이콘 */}
        <div className="relative">
          <div className="h-24 w-24 mx-auto">
            <svg
              className="animate-spin h-24 w-24 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          {/* 펄스 효과 */}
          <div className="absolute inset-0 h-24 w-24 mx-auto">
            <div className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-20"></div>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-80 mx-auto">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
          </div>
        </div>

        {/* 텍스트 */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            데이터 분석 중
          </h3>
          <p className="text-slate-600 animate-pulse">
            실시간 거래량 및 통계를 불러오고 있습니다...
          </p>
        </div>

        {/* 로딩 단계 표시 */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>
          <span className="animate-pulse">데이터 수집 중</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
