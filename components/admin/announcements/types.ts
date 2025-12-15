export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'client' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  created_by?: string | null;
  link_url?: string | null;
  link_text?: string | null;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'client' | 'admin';
  expires_at: string;
  link_url: string;
  link_text: string;
}
