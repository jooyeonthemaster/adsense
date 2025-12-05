import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DistributionType, ServiceConfig } from '@/types/blog-distribution/types';

interface ServiceTypeSelectorProps {
  services: ServiceConfig[];
  selectedType: DistributionType;
  onTypeChange: (type: DistributionType) => void;
}

export function ServiceTypeSelector({
  services,
  selectedType,
  onTypeChange,
}: ServiceTypeSelectorProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 text-base">블로그 배포 서비스 선택</CardTitle>
        <CardDescription className="text-gray-600 text-sm">원하시는 배포 유형을 선택하세요</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 pt-0">
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = selectedType === service.id;
          const isAvailable = service.available;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                if (isAvailable) {
                  onTypeChange(service.id);
                }
              }}
              disabled={!isAvailable}
              className={`
                relative w-full p-3 rounded-lg border-2 text-left transition-all duration-200
                ${isSelected
                  ? 'border-sky-500 bg-sky-50 shadow-md'
                  : isAvailable
                    ? 'border-gray-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${service.color} ${!isAvailable && 'opacity-50'}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${isSelected ? 'text-sky-700' : 'text-gray-900'}`}>
                      {service.name}
                    </span>
                    {isSelected && (
                      <Badge variant="secondary" className="bg-sky-500 text-white text-xs px-2 py-0">
                        선택됨
                      </Badge>
                    )}
                    {!isAvailable && (
                      <Badge variant="secondary" className="bg-gray-400 text-white text-xs px-2 py-0">
                        준비중
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{service.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}











