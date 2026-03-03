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
                  ? 'border-sky-500 bg-sky-50 shadow-md'
                  : isAvailable
                  ? 'border-gray-200 bg-white hover:border-sky-300 hover:bg-sky-50/50'
                  : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className={`text-sm font-medium ${isSelected ? 'text-sky-700' : 'text-gray-700'}`}>
                  {service.name}
                </span>
                {isSelected && (
                  <Badge variant="secondary" className="bg-sky-500 text-white text-xs px-2 py-0">
                    선택됨
                  </Badge>
                )}
                {!isAvailable && (
                  <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                    준비중
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

