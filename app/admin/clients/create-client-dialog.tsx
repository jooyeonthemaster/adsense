'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateClientDialogProps {
  children: React.ReactNode;
}

export function CreateClientDialog({ children }: CreateClientDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      company_name: formData.get('company_name') as string,
      contact_person: formData.get('contact_person') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      initial_points: parseInt(formData.get('initial_points') as string) || 0,
    };

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || '거래처 생성에 실패했습니다.');
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError('거래처 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle className="text-base sm:text-lg">거래처 추가</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              새로운 거래처 계정을 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="username" className="text-xs sm:text-sm">
                아이디 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                name="username"
                placeholder="로그인 아이디"
                required
                disabled={loading}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="password" className="text-xs sm:text-sm">
                비밀번호 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="초기 비밀번호"
                required
                disabled={loading}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="company_name" className="text-xs sm:text-sm">
                회사명 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_name"
                name="company_name"
                placeholder="회사명 또는 상호"
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
                  placeholder="담당자 이름"
                  disabled={loading}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">연락처</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="010-1234-5678"
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
                placeholder="example@company.com"
                disabled={loading}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
            </div>

            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="initial_points" className="text-xs sm:text-sm">초기 포인트</Label>
              <Input
                id="initial_points"
                name="initial_points"
                type="number"
                min="0"
                defaultValue="0"
                placeholder="0"
                disabled={loading}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              />
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
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            >
              취소
            </Button>
            <Button type="submit" disabled={loading} className="h-8 sm:h-9 text-xs sm:text-sm">
              {loading ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
