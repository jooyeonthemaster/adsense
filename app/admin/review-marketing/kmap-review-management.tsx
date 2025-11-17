'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { KakaomapManagementTable } from '@/app/admin/kakaomap/kakaomap-management-table';

interface KakaomapSubmission {
  id: string;
  company_name: string;
  kakaomap_url: string;
  total_count: number;
  daily_count: number;
  has_photo: boolean;
  photo_ratio: number;
  star_rating: string;
  script_type: string;
  total_points: number;
  status: string;
  created_at: string;
  clients?: {
    company_name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  };
  content_items_count: number;
  unread_messages_count: number;
  pending_revision_count: number;
}

export function KmapReviewManagement() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<KakaomapSubmission[]>([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/review-marketing/kmap');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching kmap reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <KakaomapManagementTable submissions={submissions} />;
}
