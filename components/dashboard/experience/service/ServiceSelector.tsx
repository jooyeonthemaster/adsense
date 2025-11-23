import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceType, ServiceConfig } from '@/types/experience/service-types';

interface ServiceSelectorProps {
  services: ServiceConfig[];
  selectedService: ServiceType;
  onServiceChange: (serviceId: ServiceType) => void;
}

export function ServiceSelector({
  services,
  selectedService,
  onServiceChange,
}: ServiceSelectorProps) {
  return (
    <Card className="border-gray-200 hidden md:block">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 text-base">체험 서비스 선택</CardTitle>
        <CardDescription className="text-gray-600 text-sm">원하시는 서비스를 선택하세요</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 pt-0">
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = selectedService === service.id;
          const isAvailable = service.available;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                if (isAvailable) {
                  onServiceChange(service.id);
                }
              }}
              disabled={!isAvailable}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-sky-500 bg-sky-50 shadow-md scale-105'
                  : isAvailable
                  ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-lg ${isSelected ? 'bg-sky-500' : isAvailable ? service.color : 'bg-gray-300'}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-sky-900' : 'text-gray-700'}`}>
                  {service.name}
                </span>
                {!isAvailable && (
                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                    준비중
                  </Badge>
                )}
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-sky-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

