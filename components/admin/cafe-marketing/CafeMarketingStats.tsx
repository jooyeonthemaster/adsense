import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsProps {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export function CafeMarketingStats({ total, pending, in_progress, completed }: StatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Card>
        <CardHeader className="pb-2 p-2.5 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs text-gray-500">총 접수</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          <p className="text-lg sm:text-xl font-bold">{total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 p-2.5 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs text-gray-500">확인중</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          <p className="text-lg sm:text-xl font-bold text-gray-700">{pending}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 p-2.5 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs text-sky-600">구동중</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          <p className="text-lg sm:text-xl font-bold text-sky-600">{in_progress}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 p-2.5 sm:p-3">
          <CardTitle className="text-[10px] sm:text-xs text-green-600">완료</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          <p className="text-lg sm:text-xl font-bold text-green-600">{completed}</p>
        </CardContent>
      </Card>
    </div>
  );
}

