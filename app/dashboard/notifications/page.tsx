'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, User, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/dashboard/useNotifications';
import { NotificationsTab, MyPageTab } from '@/components/dashboard/notifications';

export default function NotificationsPage() {
  const {
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
  } = useNotifications();

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
                <Badge
                  variant="destructive"
                  className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
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
          <NotificationsTab
            announcements={announcements}
            notifications={notifications}
            filteredNotifications={filteredNotifications}
            unreadCount={unreadCount}
            filter={filter}
            setFilter={setFilter}
            markAsRead={markAsRead}
          />
        </TabsContent>

        {/* 마이페이지 탭 */}
        <TabsContent value="mypage" className="space-y-6">
          <MyPageTab
            profile={profile}
            profileLoading={profileLoading}
            formData={formData}
            setFormData={setFormData}
            saving={saving}
            uploading={uploading}
            saveProfile={saveProfile}
            handleFileUpload={handleFileUpload}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
