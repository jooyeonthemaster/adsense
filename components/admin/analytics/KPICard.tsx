import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Activity,
  Calendar,
  Clock,
} from 'lucide-react';

const iconMap = {
  ShoppingCart,
  DollarSign,
  Users,
  Activity,
  Calendar,
  Clock,
};

const gradients = [
  'from-primary to-primary/80',
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
];

interface KPICardProps {
  title: string;
  value: number | string;
  previousValue: number;
  trend: { trend: 'up' | 'down' | 'stable'; changePercent: number };
  iconName: keyof typeof iconMap;
  unit: string;
  gradientIndex: number;
}

export function KPICard({
  title,
  value,
  previousValue,
  trend,
  iconName,
  unit,
  gradientIndex,
}: KPICardProps) {
  const Icon = iconMap[iconName] || Activity;

  const getTrendIcon = () => {
    if (trend.trend === 'up') return <TrendingUp className="h-3 w-3" />;
    if (trend.trend === 'down') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend.trend === 'up') return 'text-emerald-600';
    if (trend.trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={`rounded-lg bg-gradient-to-br ${gradients[gradientIndex % gradients.length]} p-2.5 shadow-lg`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
          <span className="text-sm font-normal ml-1">{unit}</span>
        </div>
        <div className={`flex items-center text-xs ${getTrendColor()} mt-1`}>
          {getTrendIcon()}
          <span className="ml-1 flex items-center gap-1">
            {trend.changePercent > 0 ? '+' : ''}
            {trend.changePercent}%
            <span className="text-muted-foreground">vs 어제</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

