// 알림/마이페이지 타입 정의

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  expires_at: string | null;
  link_url?: string | null;
  link_text?: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  read: boolean;
  created_at: string;
}

export interface ClientProfile {
  id: string;
  username: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  business_license_url: string | null;
  business_license_name: string | null;
  tax_email: string | null;
  profile_updated_at: string | null;
  created_at: string;
  client_type: 'advertiser' | 'agency' | null;
  onboarding_completed: boolean;
}

export interface ProfileFormData {
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  tax_email: string;
}

export type NotificationFilter = 'all' | 'unread';
