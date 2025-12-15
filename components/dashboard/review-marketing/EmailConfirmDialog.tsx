'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { SUPPORT_EMAIL } from './constants';

interface EmailConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function EmailConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: EmailConfirmDialogProps) {
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // 다이얼로그가 열릴 때마다 확인 상태 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setEmailConfirmed(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            잠깐!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-base text-gray-700 font-medium">이메일로 필수 서류는 보내셨나요?</p>
              <p className="text-sm text-gray-600">보내셔야 주문이 정상적으로 처리됩니다.</p>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-700 mb-1">전송 이메일 주소</p>
                <p className="text-sm font-bold text-purple-900">{SUPPORT_EMAIL}</p>
                <p className="text-xs text-purple-600 mt-2">
                  📌 이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성해
                  주세요.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  📎 필수 서류: 사업자등록증 or 샘플 영수증 (둘 중 하나)
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={emailConfirmed}
                  onClick={() => setEmailConfirmed(!emailConfirmed)}
                  className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 ${
                    emailConfirmed
                      ? 'bg-purple-500 border-purple-500 shadow-lg'
                      : 'bg-white border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {emailConfirmed && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-white"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  )}
                </button>
                <label
                  onClick={() => setEmailConfirmed(!emailConfirmed)}
                  className="text-sm font-medium cursor-pointer select-none text-gray-700"
                >
                  네, 서류를 이메일로 보냈습니다
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="flex-1">취소</AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={!emailConfirmed || isSubmitting}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
          >
            {isSubmitting ? '접수 중...' : '접수하기'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
