'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Megaphone,
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  DollarSign,
  FileText,
  Clock,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  expires_at: string | null;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // 데이터 불러오기
  const fetchData = async () => {
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
      toast({
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/client/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('읽음 처리 실패');

      // 로컬 상태 업데이트
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
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
      toast({
        title: '오류',
        description: '전체 읽음 처리에 실패했습니다',
        variant: 'destructive',
      });
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
        return <CheckCheck className="h-5 w-5" />;
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
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">알림</h1>
            <p className="text-sm text-muted-foreground">
              공지사항과 개인 알림을 확인하세요
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            전체 읽음 처리
          </Button>
        )}
      </div>

      {/* 메인 컨텐츠: 왼쪽 공지사항, 오른쪽 개인 알림 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 왼쪽: 공지사항 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">공지사항</h2>
            <Badge variant="secondary">{announcements.length}</Badge>
          </div>

          <ScrollArea className="h-[calc(100vh-300px)]">
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
                        <Badge variant="destructive" className="shrink-0">
                          긴급
                        </Badge>
                      )}
                      {announcement.priority === 'high' && (
                        <Badge variant="default" className="shrink-0">
                          중요
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                      {announcement.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {format(new Date(announcement.created_at), 'yyyy-MM-dd HH:mm', {
                          locale: ko,
                        })}
                      </span>
                      {announcement.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(announcement.expires_at), 'yyyy-MM-dd까지', {
                            locale: ko,
                          })}
                        </span>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* 오른쪽: 개인 알림 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">개인 알림</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
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

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>
                    {filter === 'unread'
                      ? '읽지 않은 알림이 없습니다'
                      : '알림이 없습니다'}
                  </p>
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
                          <h4 className="font-semibold text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(notification.created_at),
                              'yyyy-MM-dd HH:mm',
                              { locale: ko }
                            )}
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
    </div>
  );
}

