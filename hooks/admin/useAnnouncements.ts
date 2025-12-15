import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Announcement, AnnouncementFormData } from '@/components/admin/announcements/types';
import { INITIAL_FORM_DATA } from '@/components/admin/announcements/constants';

export function useAnnouncements() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>(INITIAL_FORM_DATA);

  // 공지사항 목록 불러오기
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/announcements');
      if (!response.ok) throw new Error('공지사항을 불러오는데 실패했습니다');
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      toast({
        title: '오류',
        description: '공지사항을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 공지사항 생성/수정
  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast({
          title: '입력 오류',
          description: '제목과 내용을 입력해주세요',
          variant: 'destructive',
        });
        return;
      }

      const url = '/api/admin/announcements';
      const method = selectedAnnouncement ? 'PUT' : 'POST';
      const body = selectedAnnouncement
        ? { ...formData, id: selectedAnnouncement.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('공지사항 저장에 실패했습니다');

      toast({
        title: '성공',
        description: `공지사항이 ${selectedAnnouncement ? '수정' : '생성'}되었습니다`,
      });

      setDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      toast({
        title: '오류',
        description: '공지사항 저장에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 공지사항 삭제
  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    try {
      const response = await fetch(
        `/api/admin/announcements?id=${selectedAnnouncement.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('공지사항 삭제에 실패했습니다');

      toast({
        title: '성공',
        description: '공지사항이 삭제되었습니다',
      });

      setDeleteDialogOpen(false);
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      toast({
        title: '오류',
        description: '공지사항 삭제에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 활성/비활성 토글
  const toggleActive = async (announcement: Announcement) => {
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: announcement.id,
          is_active: !announcement.is_active,
        }),
      });

      if (!response.ok) throw new Error('상태 변경에 실패했습니다');

      toast({
        title: '성공',
        description: `공지사항이 ${!announcement.is_active ? '활성화' : '비활성화'}되었습니다`,
      });

      fetchAnnouncements();
    } catch (error) {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      target_audience: announcement.target_audience,
      expires_at: announcement.expires_at
        ? format(new Date(announcement.expires_at), "yyyy-MM-dd'T'HH:mm")
        : '',
      link_url: announcement.link_url || '',
      link_text: announcement.link_text || '',
    });
    setDialogOpen(true);
  };

  // 폼 초기화
  const resetForm = () => {
    setSelectedAnnouncement(null);
    setFormData(INITIAL_FORM_DATA);
  };

  // 새 공지사항 다이얼로그 열기
  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  // 삭제 다이얼로그 열기
  const openDeleteDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  return {
    announcements,
    loading,
    dialogOpen,
    deleteDialogOpen,
    selectedAnnouncement,
    formData,
    setDialogOpen,
    setDeleteDialogOpen,
    setFormData,
    handleSubmit,
    handleDelete,
    toggleActive,
    openEditDialog,
    openCreateDialog,
    openDeleteDialog,
    resetForm,
  };
}
