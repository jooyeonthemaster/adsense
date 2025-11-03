'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client } from '@/types/database';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

interface ResetPasswordDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({
  client,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);

  // 랜덤 비밀번호 생성 (8자리)
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const passwordToSet = useCustomPassword ? customPassword : generateRandomPassword();

      if (useCustomPassword && customPassword.length < 4) {
        setError('비밀번호는 최소 4자 이상이어야 합니다.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/clients/${client.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: passwordToSet }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '비밀번호 재설정에 실패했습니다.');
      }

      const data = await response.json();
      setNewPassword(data.newPassword);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    alert('비밀번호가 클립보드에 복사되었습니다.');
  };

  const handleClose = () => {
    setNewPassword('');
    setSuccess(false);
    setError('');
    setCustomPassword('');
    setUseCustomPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-base sm:text-lg">비밀번호 재설정</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {client.company_name} ({client.username})의 비밀번호를 재설정합니다.
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-custom"
                checked={useCustomPassword}
                onChange={(e) => setUseCustomPassword(e.target.checked)}
                className="rounded w-4 h-4"
              />
              <Label htmlFor="use-custom" className="text-xs sm:text-sm">직접 비밀번호 입력</Label>
            </div>

            {useCustomPassword && (
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="custom-password" className="text-xs sm:text-sm">새 비밀번호</Label>
                <Input
                  id="custom-password"
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="새 비밀번호 입력 (최소 4자)"
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            )}

            {!useCustomPassword && (
              <div className="p-3 sm:p-4 bg-muted rounded-md">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  8자리 랜덤 비밀번호가 자동으로 생성됩니다.
                </p>
              </div>
            )}

            {error && (
              <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} className="h-8 sm:h-9 text-xs sm:text-sm">
                취소
              </Button>
              <Button onClick={handleResetPassword} disabled={loading} className="h-8 sm:h-9 text-xs sm:text-sm">
                {loading ? '재설정 중...' : '비밀번호 재설정'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-xs sm:text-sm text-green-800 dark:text-green-200 font-medium mb-1.5 sm:mb-2">
                ✓ 비밀번호가 성공적으로 재설정되었습니다.
              </p>
              <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300">
                아래 비밀번호를 거래처에게 전달해주세요.
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">새 비밀번호</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    readOnly
                    className="pr-10 font-mono h-8 sm:h-9 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                  title="복사"
                  className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            <div className="p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-[10px] sm:text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ 이 비밀번호는 다시 확인할 수 없습니다. 반드시 복사하거나 기록해두세요.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="h-8 sm:h-9 text-xs sm:text-sm">확인</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
