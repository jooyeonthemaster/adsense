'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState(client.is_active);

  useEffect(() => {
    setIsActive(client.is_active);
  }, [client]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      company_name: formData.get('company_name') as string,
      contact_person: formData.get('contact_person') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      is_active: isActive,
    };

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '거래처 수정에 실패했습니다.');
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError('거래처 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg">거래처 수정</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              거래처 정보를 수정합니다. (아이디: {client.username})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="company_name" className="text-xs sm:text-sm">
                회사명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_name"
                name="company_name"
                defaultValue={client.company_name}
                required
                disabled={loading}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="contact_person" className="text-xs sm:text-sm">담당자</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  defaultValue={client.contact_person || ''}
                  disabled={loading}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">연락처</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={client.phone || ''}
                  disabled={loading}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={client.email || ''}
                disabled={loading}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-xs sm:text-sm">상태</Label>
              <Select
                value={isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setIsActive(value === 'active')}
                disabled={loading}
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-xs sm:text-sm">활성</SelectItem>
                  <SelectItem value="inactive" className="text-xs sm:text-sm">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md mb-3 sm:mb-4">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              취소
            </Button>
            <Button type="submit" disabled={loading} className="h-8 sm:h-9 text-xs sm:text-sm">
              {loading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
