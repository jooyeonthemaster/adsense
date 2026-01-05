'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AsRequestsTable } from './as-requests-table';
import { CancellationRequestsTable } from '@/components/admin/cancellation-requests/CancellationRequestsTable';
import { Wrench, XCircle } from 'lucide-react';

export function AsRequestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get('tab') || 'as';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`/admin/as-requests?${params.toString()}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="as" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">AS 신청</span>
          <span className="sm:hidden">AS</span>
        </TabsTrigger>
        <TabsTrigger value="cancellation" className="flex items-center gap-2">
          <XCircle className="h-4 w-4" />
          <span className="hidden sm:inline">중단 요청</span>
          <span className="sm:hidden">중단</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="as" className="mt-4">
        <AsRequestsTable />
      </TabsContent>

      <TabsContent value="cancellation" className="mt-4">
        <CancellationRequestsTable />
      </TabsContent>
    </Tabs>
  );
}
