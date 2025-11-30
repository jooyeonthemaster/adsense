'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Megaphone,
  Bell,
  CheckCheck,
  DollarSign,
  FileText,
  Clock,
  Eye,
  User,
  Building2,
  Mail,
  Phone,
  Upload,
  MessageCircle,
  Save,
  Loader2,
  ExternalLink,
  FileCheck,
  MapPin,
  Edit,
  ThumbsUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  expires_at: string | null;
  link_url?: string | null;
  link_text?: string | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  read: boolean;
  created_at: string;
}

interface ClientProfile {
  id: string;
  username: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  business_license_url: string | null;
  business_license_name: string | null;
  business_number: string | null;
  representative_name: string | null;
  business_address: string | null;
  tax_email: string | null;
  profile_updated_at: string | null;
  created_at: string;
}

// 카카오 채널 URL (실제 채널 URL로 교체 필요)
const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_xnxkGxj'; // 예시 URL

export default function NotificationsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [activeTab, setActiveTab] = useState('notifications');

  // 마이페이지 상태
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    business_number: '',
    representative_name: '',
    business_address: '',
    tax_email: '',
  });

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
          business_number: data.business_number || '',
          representative_name: data.representative_name || '',
          business_address: data.business_address || '',
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
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'mypage') {
      fetchProfile();
    }
  }, [activeTab, fetchProfile]);

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

      fetchProfile();
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
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(fileName);

      // 프로필 업데이트
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_license_url: publicUrl,
          business_license_name: file.name,
        }),
      });

      if (!response.ok) throw new Error('프로필 업데이트 실패');

      toast({
        title: '성공',
        description: '사업자등록증이 업로드되었습니다',
      });

      fetchProfile();
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

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 알림 타입 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission_created':
      case 'submission_status_changed':
        return <FileText className="h-5 w-5" />;
      case 'points_charged':
      case 'points_low':
      case 'charge_request_status_changed':
        return <DollarSign className="h-5 w-5" />;
      case 'daily_record_updated':
        return <Clock className="h-5 w-5" />;
      case 'as_request_resolved':
      case 'as_approved':
      case 'as_rejected':
        return <CheckCheck className="h-5 w-5" />;
      // 카카오맵 리뷰 관련 알림
      case 'kakaomap_content_uploaded':
        return <Upload className="h-5 w-5" />;
      case 'kakaomap_revision_requested':
        return <Edit className="h-5 w-5" />;
      case 'kakaomap_feedback_added':
        return <MessageCircle className="h-5 w-5" />;
      case 'kakaomap_content_approved':
        return <ThumbsUp className="h-5 w-5" />;
      case 'kakaomap_message_received':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // 필터링된 알림
  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 탭 구조 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">알림</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mypage" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">마이페이지</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'notifications' && unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              전체 읽음 처리
            </Button>
          )}
        </div>

        {/* 알림 탭 */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 공지사항 */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">공지사항</h2>
                <Badge variant="secondary">{announcements.length}</Badge>
              </div>

              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-3">
                  {announcements.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>등록된 공지사항이 없습니다</p>
                    </div>
                  ) : (
                    announcements.map((announcement) => (
                      <Card
                        key={announcement.id}
                        className={cn(
                          'p-4 border-l-4 transition-colors hover:bg-accent/50',
                          getPriorityColor(announcement.priority)
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          {announcement.priority === 'urgent' && (
                            <Badge variant="destructive" className="shrink-0">긴급</Badge>
                          )}
                          {announcement.priority === 'high' && (
                            <Badge variant="default" className="shrink-0">중요</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                          {announcement.content}
                        </p>
                        {announcement.link_url && (
                          <div className="mb-3">
                            {announcement.link_url.startsWith('http') ? (
                              <a
                                href={announcement.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {announcement.link_text || '자세히 보기'}
                              </a>
                            ) : (
                              <a
                                href={announcement.link_url}
                                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {announcement.link_text || '자세히 보기'}
                              </a>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {format(new Date(announcement.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </span>
                          {announcement.expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(announcement.expires_at), 'yyyy-MM-dd까지', { locale: ko })}
                            </span>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>

            {/* 개인 알림 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">개인 알림</h2>
                  {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    전체
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                  >
                    읽지 않음
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>{filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={cn(
                          'p-4 transition-all hover:shadow-md cursor-pointer',
                          !notification.read && 'bg-primary/5 border-primary/20'
                        )}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'p-2 rounded-lg shrink-0',
                              notification.read
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1"></div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                              </span>
                              {notification.read && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Eye className="h-3 w-3" />
                                  읽음
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        {/* 마이페이지 탭 */}
        <TabsContent value="mypage" className="space-y-6">
          {profileLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">프로필 로딩 중...</p>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">기본 정보</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-sm">아이디</Label>
                    <Input value={profile?.username || ''} disabled className="bg-muted" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="company_name">회사명</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="회사/상호명"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contact_person">담당자명</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="담당자 이름"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">연락처</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          // 숫자만 추출
                          const nums = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                          // 010-0000-0000 형식으로 포맷팅
                          let formatted = nums;
                          if (nums.length > 3) {
                            formatted = nums.slice(0, 3) + '-' + nums.slice(3);
                          }
                          if (nums.length > 7) {
                            formatted = nums.slice(0, 3) + '-' + nums.slice(3, 7) + '-' + nums.slice(7);
                          }
                          setFormData({ ...formData, phone: formatted });
                        }}
                        placeholder="010-0000-0000"
                        className="pl-10"
                        maxLength={13}
                      />
                    </div>
                  </div>

                  </div>
              </Card>

              {/* 사업자 정보 */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">사업자 정보</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="business_number">사업자등록번호</Label>
                    <Input
                      id="business_number"
                      value={formData.business_number}
                      onChange={(e) => {
                        // 숫자만 추출
                        const nums = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        // 000-00-00000 형식으로 포맷팅
                        let formatted = nums;
                        if (nums.length > 3) {
                          formatted = nums.slice(0, 3) + '-' + nums.slice(3);
                        }
                        if (nums.length > 5) {
                          formatted = nums.slice(0, 3) + '-' + nums.slice(3, 5) + '-' + nums.slice(5);
                        }
                        setFormData({ ...formData, business_number: formatted });
                      }}
                      placeholder="000-00-00000"
                      maxLength={12}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="representative_name">대표자명</Label>
                    <Input
                      id="representative_name"
                      value={formData.representative_name}
                      onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
                      placeholder="대표자 이름"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="business_address">사업장 주소</Label>
                    <Input
                      id="business_address"
                      value={formData.business_address}
                      onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                      placeholder="사업장 주소"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tax_email">세금계산서 수령 이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="tax_email"
                        type="email"
                        value={formData.tax_email}
                        onChange={(e) => setFormData({ ...formData, tax_email: e.target.value })}
                        placeholder="tax@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 사업자등록증 업로드 */}
                  <div className="grid gap-2">
                    <Label>사업자등록증</Label>
                    {profile?.business_license_url ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                        <FileCheck className="h-5 w-5 text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 flex-1 min-w-0 truncate">
                          {profile.business_license_name || '업로드됨'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => window.open(profile.business_license_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="flex-1"
                      />
                      {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF, PDF (최대 5MB)
                    </p>
                  </div>
                </div>
              </Card>

              {/* 저장 버튼 & 1:1 문의 */}
              <Card className="p-6 lg:col-span-2">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {profile?.profile_updated_at && (
                      <p className="text-sm text-muted-foreground">
                        마지막 수정: {format(new Date(profile.profile_updated_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* 1:1 문의 버튼 */}
                    <Button
                      variant="outline"
                      onClick={() => window.open(KAKAO_CHANNEL_URL, '_blank')}
                      className="flex-1 sm:flex-none"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      1:1 문의 (카카오톡)
                    </Button>
                    {/* 저장 버튼 */}
                    <Button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex-1 sm:flex-none"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      저장하기
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
