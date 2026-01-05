'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import type {
  Announcement,
  Notification,
  ClientProfile,
  ProfileFormData,
  NotificationFilter,
} from '@/components/dashboard/notifications/types';

export interface UseNotificationsReturn {
  // Tab state
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Notifications data
  announcements: Announcement[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  filteredNotifications: Notification[];

  // Profile data
  profile: ClientProfile | null;
  profileLoading: boolean;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  saving: boolean;
  uploading: boolean;

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  saveProfile: () => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  fetchData: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'mypage' ? 'mypage' : 'notifications');

  // Notifications state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  // Profile state
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    tax_email: '',
  });

  // URL 파라미터 변경 시 탭 업데이트 (URL이 변경될 때만)
  useEffect(() => {
    if (tabParam === 'mypage' && activeTab !== 'mypage') {
      setActiveTab('mypage');
    }
    // 주석 처리: URL에 tab 파라미터가 없을 때 강제로 notifications로 되돌리지 않음
    // else if (tabParam !== 'mypage' && activeTab === 'mypage') {
    //   setActiveTab('notifications');
    // }
  }, [tabParam, activeTab]);

  // 데이터 불러오기
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [announcementsRes, notificationsRes] = await Promise.all([
        fetch('/api/client/announcements'),
        fetch('/api/client/notifications'),
      ]);

      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.notifications);
        setUnreadCount(notificationsData.unreadCount);
      }
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
      toast({
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 프로필 불러오기
  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const response = await fetch('/api/client/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          company_name: data.company_name || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          email: data.email || '',
          tax_email: data.tax_email || '',
        });
      }
    } catch (error) {
      console.error('프로필 로딩 오류:', error);
      toast({
        title: '오류',
        description: '프로필을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setProfileLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 프로필 한 번만 로드 (탭이 mypage로 변경될 때만)
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (activeTab === 'mypage' && !profileLoaded) {
      fetchProfile();
      setProfileLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profileLoaded]);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/client/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('읽음 처리 실패');

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('읽음 처리 오류:', error);
      toast({
        title: '오류',
        description: '읽음 처리에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/client/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('전체 읽음 처리 실패');

      toast({
        title: '성공',
        description: '모든 알림을 읽음 처리했습니다',
      });

      fetchData();
    } catch (error) {
      console.error('전체 읽음 처리 오류:', error);
      toast({
        title: '오류',
        description: '전체 읽음 처리에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 프로필 저장
  const saveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('프로필 저장 실패');

      toast({
        title: '성공',
        description: '프로필이 저장되었습니다',
      });

      // 프로필 재로드 및 페이지 새로고침 (검증 통과 확인)
      setProfileLoaded(false);
      await fetchProfile();

      // 서버 컴포넌트 리렌더링 (layout.tsx의 profileCheck 재실행)
      router.refresh();
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      toast({
        title: '오류',
        description: '프로필 저장에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // 사업자등록증 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '오류',
        description: '파일 크기는 5MB 이하여야 합니다',
        variant: 'destructive',
      });
      return;
    }

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: '오류',
        description: 'JPG, PNG, GIF, PDF 파일만 업로드 가능합니다',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();

      // 파일명 생성
      const fileExt = file.name.split('.').pop();
      const fileName = `business-license/${profile?.id}/${Date.now()}.${fileExt}`;

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Public URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('submissions').getPublicUrl(fileName);

      // 프로필 업데이트 - 현재 입력된 모든 formData와 파일 정보를 함께 저장
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData, // 현재 입력된 모든 데이터 포함
          business_license_url: publicUrl,
          business_license_name: file.name,
        }),
      });

      if (!response.ok) throw new Error('프로필 업데이트 실패');

      toast({
        title: '성공',
        description: '사업자등록증이 업로드되었습니다',
      });

      // 프로필 재로드 및 페이지 새로고침 (검증 통과 확인)
      setProfileLoaded(false);
      await fetchProfile();

      // 서버 컴포넌트 리렌더링 (layout.tsx의 profileCheck 재실행)
      router.refresh();
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      toast({
        title: '오류',
        description: '파일 업로드에 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // 필터링된 알림
  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Notifications data
    announcements,
    notifications,
    unreadCount,
    loading,
    filter,
    setFilter,
    filteredNotifications,

    // Profile data
    profile,
    profileLoading,
    formData,
    setFormData,
    saving,
    uploading,

    // Actions
    markAsRead,
    markAllAsRead,
    saveProfile,
    handleFileUpload,
    fetchData,
    fetchProfile,
  };
}
