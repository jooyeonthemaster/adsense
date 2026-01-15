'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Megaphone,
  Bell,
  DollarSign,
  FileText,
  Clock,
  Eye,
  Upload,
  MessageCircle,
  ExternalLink,
  Edit,
  ThumbsUp,
  CheckCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getPriorityColor } from './constants';
import type { Announcement, Notification, NotificationFilter } from './types';
import { useRouter } from 'next/navigation';

// 영어 상태값을 한글로 변환하는 매핑
const STATUS_LABELS: Record<string, string> = {
  // 공통 상태
  pending: '대기',
  approved: '승인',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
  // 카카오맵/리뷰 관련
  waiting_content: '콘텐츠 대기중',
  review: '검수중',
  revision_requested: '수정 요청',
  as_in_progress: 'AS 진행중',
  // 중단 관련
  cancellation_requested: '중단요청',
  cancellation_approved: '중단승인',
  // 카페 관련
  script_writing: '원고 작성중',
  script_completed: '원고 작성완료',
  // 충전 요청 관련
  rejected: '거절됨',
};

// 알림 메시지 내 영어 상태값을 한글로 변환
const translateStatusInMessage = (message: string): string => {
  let translated = message;

  // 상태값 매핑을 순회하며 영어 → 한글 변환
  Object.entries(STATUS_LABELS).forEach(([eng, kor]) => {
    // "접수가 waiting_content 되었습니다" 같은 패턴 처리
    translated = translated.replace(new RegExp(`\\b${eng}\\b`, 'gi'), kor);
  });

  return translated;
};

// submission_type을 product key로 변환하는 매핑
const submissionTypeToProduct: Record<string, string> = {
  kakaomap_review_submissions: 'kakaomap',
  visitor_review_submissions: 'receipt',
  reward_submissions: 'reward-twoople', // 기본값은 투플
  cafe_submissions: 'infiltration-cafe',
  blog_distribution_submissions: 'blog-video', // 기본값은 영상 배포
  experience_submissions: 'experience-blog', // 기본값은 블로그 체험단
};

// product key를 category로 변환하는 매핑
const productToCategory: Record<string, string> = {
  kakaomap: 'review',
  receipt: 'review',
  'reward-twoople': 'reward',
  'reward-eureka': 'reward',
  'infiltration-cafe': 'infiltration',
  'infiltration-community': 'infiltration',
  'blog-video': 'blog',
  'blog-automation': 'blog',
  'blog-reviewer': 'blog',
  'experience-blog': 'experience',
  'experience-xiaohongshu': 'experience',
  'experience-journalist': 'experience',
  'experience-influencer': 'experience',
};

// submission_type을 상세 페이지 경로로 변환하는 매핑
const submissionTypeToDetailPath: Record<string, string> = {
  kakaomap_review_submissions: '/dashboard/review/kmap/status',
  visitor_review_submissions: '/dashboard/review/visitor/status',
  place_submissions: '/dashboard/reward/status',
  blog_distribution_submissions: '/dashboard/blog-distribution/status/detail',
  experience_submissions: '/dashboard/experience/detail',
  cafe_marketing_submissions: '/dashboard/cafe/status/detail',
};

// 알림 타입별 이동 경로를 결정하는 함수
const getNotificationLink = (notification: Notification): string | null => {
  const data = notification.data as any;
  const submissionId = data?.submission_id;
  const submissionType = data?.submission_type;

  // 1. submission_id + submission_type이 있으면 상세 페이지로 직접 이동
  if (submissionId && submissionType) {
    const detailPath = submissionTypeToDetailPath[submissionType];
    if (detailPath) {
      return `${detailPath}/${submissionId}`;
    }
  }

  // 2. submission_id만 있고 카카오맵 관련 알림이면 카카오맵 상세로 이동
  if (submissionId) {
    switch (notification.type) {
      case 'kakaomap_feedback_added':
      case 'kakaomap_content_uploaded':
      case 'kakaomap_revision_requested':
      case 'kakaomap_content_approved':
      case 'kakaomap_message_received':
        return `/dashboard/review/kmap/status/${submissionId}`;
    }
  }

  // 3. Fallback: 타입별 기본 경로 (목록 페이지)
  switch (notification.type) {
    // 카카오맵 리뷰 관련 (submission_id 없는 경우)
    case 'kakaomap_feedback_added':
    case 'kakaomap_content_uploaded':
    case 'kakaomap_revision_requested':
    case 'kakaomap_content_approved':
    case 'kakaomap_message_received':
    case 'daily_record_updated':
      return '/dashboard/submissions?category=review&product=kakaomap';

    // 접수 상태 변경
    case 'submission_status_changed':
      if (submissionType) {
        const product = submissionTypeToProduct[submissionType];
        const category = product ? productToCategory[product] : null;
        if (category && product) {
          return `/dashboard/submissions?category=${category}&product=${product}`;
        }
      }
      return '/dashboard/submissions';

    // 포인트 관련
    case 'points_charged':
    case 'points_low':
    case 'charge_request_status_changed':
      return '/dashboard/points';

    // AS 요청 관련
    case 'as_request_resolved':
    case 'as_approved':
    case 'as_rejected':
      if (submissionType) {
        const product = submissionTypeToProduct[submissionType];
        const category = product ? productToCategory[product] : null;
        if (category && product) {
          return `/dashboard/submissions?category=${category}&product=${product}`;
        }
      }
      return '/dashboard/submissions';

    default:
      return null;
  }
};

interface NotificationsTabProps {
  announcements: Announcement[];
  notifications: Notification[];
  filteredNotifications: Notification[];
  unreadCount: number;
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  markAsRead: (notificationId: string) => Promise<void>;
}

export function NotificationsTab({
  announcements,
  filteredNotifications,
  unreadCount,
  filter,
  setFilter,
  markAsRead,
}: NotificationsTabProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* 공지사항 */}
      <AnnouncementsCard announcements={announcements} />

      {/* 개인 알림 */}
      <PersonalNotificationsCard
        filteredNotifications={filteredNotifications}
        unreadCount={unreadCount}
        filter={filter}
        setFilter={setFilter}
        markAsRead={markAsRead}
      />
    </div>
  );
}

function AnnouncementsCard({ announcements }: { announcements: Announcement[] }) {
  return (
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
  );
}

function PersonalNotificationsCard({
  filteredNotifications,
  unreadCount,
  filter,
  setFilter,
  markAsRead,
}: {
  filteredNotifications: Notification[];
  unreadCount: number;
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
  markAsRead: (notificationId: string) => Promise<void>;
}) {
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // 이동 경로 결정
    const link = getNotificationLink(notification);
    if (link) {
      router.push(link);
    }
  };

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

  return (
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
                onClick={() => handleNotificationClick(notification)}
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
                    <p className="text-sm text-muted-foreground mb-2">{translateStatusInMessage(notification.message)}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(notification.created_at), 'yyyy-MM-dd HH:mm', {
                          locale: ko,
                        })}
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
  );
}
