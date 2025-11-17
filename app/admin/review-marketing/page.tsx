'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { VisitorReviewManagement } from './visitor-review-management';
import { KmapReviewManagement } from './kmap-review-management';

export default function ReviewMarketingPage() {
  const [activeTab, setActiveTab] = useState('visitor');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">리뷰 마케팅 관리</h1>
        <p className="text-muted-foreground">
          방문자 리뷰와 K맵 리뷰 캠페인을 관리하세요
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="visitor">방문자 리뷰</TabsTrigger>
          <TabsTrigger value="kmap">K맵 리뷰</TabsTrigger>
        </TabsList>

        <TabsContent value="visitor" className="space-y-6">
          <VisitorReviewManagement />
        </TabsContent>

        <TabsContent value="kmap" className="space-y-6">
          <KmapReviewManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
