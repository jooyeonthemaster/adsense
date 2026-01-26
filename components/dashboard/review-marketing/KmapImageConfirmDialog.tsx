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
import { Mail } from 'lucide-react';

interface KmapImageConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function KmapImageConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: KmapImageConfirmDialogProps) {
  const [imageConfirmed, setImageConfirmed] = useState(false);

  // 다이얼로그가 열릴 때마다 확인 상태 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setImageConfirmed(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-sky-700">
            <Mail className="h-5 w-5" />
            이미지 전송 확인
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-base text-gray-700 font-medium">
                이메일로 이미지를 보내셨나요?
              </p>
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg space-y-2">
                <p className="text-sm font-bold text-sky-900">sense-ad@naver.com</p>
                <p className="text-xs text-sky-600">
                  이메일 제목은 <span className="font-semibold">업체명 or 대행사명</span>으로 작성
                </p>
                <p className="text-xs font-medium text-sky-700 pt-1 border-t border-sky-200">
                  사진 100장 이상 전달 필수
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={imageConfirmed}
                  onClick={() => setImageConfirmed(!imageConfirmed)}
                  className={`relative flex items-center justify-center h-6 w-6 rounded border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                    imageConfirmed
                      ? 'bg-sky-500 border-sky-500 shadow-lg'
                      : 'bg-white border-gray-300 hover:border-sky-400'
                  }`}
                >
                  {imageConfirmed && (
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
                  onClick={() => setImageConfirmed(!imageConfirmed)}
                  className="text-sm font-medium cursor-pointer select-none text-gray-700"
                >
                  네, 이미지를 이메일로 보냈습니다
                </label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="flex-1">취소</AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={!imageConfirmed || isSubmitting}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
          >
            {isSubmitting ? '접수 중...' : '접수하기'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
