import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend: { trend: 'up' | 'down' | 'stable'; changePercent: number };
  icon: ReactNode;
}

export function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  const getTrendColor = () => {
    if (trend.trend === 'up') return 'text-emerald-600';
    if (trend.trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className="border-primary/10 hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        <p className={`text-xs ${getTrendColor()} mt-1 font-medium`}>
          {trend.changePercent > 0 ? '+' : ''}
          {trend.changePercent}%
        </p>
      </CardContent>
    </Card>
  );
}

