'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
  User,
  Shield,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAnnouncements } from '@/hooks/admin/useAnnouncements';
import {
  PRIORITY_VARIANTS,
  PRIORITY_LABELS,
  AUDIENCE_LABELS,
} from '@/components/admin/announcements';

export default function AnnouncementsPage() {
  const {
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
  } = useAnnouncements();

  // 우선순위 배지
  const getPriorityBadge = (priority: string) => {
    return (
      <Badge variant={PRIORITY_VARIANTS[priority as keyof typeof PRIORITY_VARIANTS]}>
        {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]}
      </Badge>
    );
  };

  // 대상 아이콘
  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all':
        return <Users className="h-4 w-4" />;
      case 'client':
        return <User className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    return AUDIENCE_LABELS[audience as keyof typeof AUDIENCE_LABELS];
  };

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
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">공지사항 관리</h1>
            <p className="text-sm text-muted-foreground">
              거래처 및 관리자 공지사항을 등록하고 관리합니다
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          공지사항 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">전체 공지사항</p>
              <p className="text-2xl font-bold">{announcements.length}</p>
            </div>
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">활성 공지</p>
              <p className="text-2xl font-bold">
                {announcements.filter((a) => a.is_active).length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">긴급 공지</p>
              <p className="text-2xl font-bold">
                {announcements.filter((a) => a.priority === 'urgent' && a.is_active).length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* 공지사항 테이블 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>우선순위</TableHead>
              <TableHead>대상</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead>만료일</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  등록된 공지사항이 없습니다
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell className="font-medium max-w-md">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="truncate">{announcement.title}</p>
                        {announcement.link_url && (
                          <ExternalLink className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {announcement.content.substring(0, 50)}
                        {announcement.content.length > 50 && '...'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(announcement.priority)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getAudienceIcon(announcement.target_audience)}
                      <span className="text-sm">
                        {getAudienceLabel(announcement.target_audience)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(announcement)}
                    >
                      {announcement.is_active ? (
                        <Badge variant="default">활성</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(announcement.created_at), 'yyyy-MM-dd HH:mm', {
                      locale: ko,
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {announcement.expires_at
                      ? format(new Date(announcement.expires_at), 'yyyy-MM-dd HH:mm', {
                          locale: ko,
                        })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(announcement)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAnnouncement ? '공지사항 수정' : '공지사항 등록'}
            </DialogTitle>
            <DialogDescription>
              {selectedAnnouncement
                ? '공지사항 내용을 수정합니다'
                : '새로운 공지사항을 등록합니다'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="content">내용 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="공지사항 내용을 입력하세요"
                rows={8}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">우선순위</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="normal">보통</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="target_audience">대상</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, target_audience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="client">거래처</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="expires_at">만료일 (선택)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                만료일을 설정하지 않으면 영구적으로 표시됩니다
              </p>
            </div>

            {/* 링크 설정 */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">링크 첨부 (선택)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="link_url">링크 URL</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://example.com 또는 /dashboard/..."
                  />
                </div>
                <div>
                  <Label htmlFor="link_text">링크 버튼 텍스트</Label>
                  <Input
                    id="link_text"
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="자세히 보기"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                외부 링크(https://)나 내부 경로(/dashboard/...)를 입력할 수 있습니다
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleSubmit}>
              {selectedAnnouncement ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

