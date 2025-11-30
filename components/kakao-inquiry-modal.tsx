'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

// 카카오톡 아이콘 컴포넌트
function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.652 1.768 4.986 4.428 6.317-.178.632-.645 2.291-.739 2.648-.116.445.163.439.343.32.141-.094 2.248-1.524 3.167-2.144.582.086 1.18.13 1.801.13 5.523 0 10-3.463 10-7.271C21 6.463 17.523 3 12 3z"/>
    </svg>
  );
}

interface KakaoInquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

// TODO: 실제 카카오톡 채널 URL로 교체 필요
const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_xxxxxxxxxxx/chat';

export function KakaoInquiryModal({
  open,
  onOpenChange,
  title = '1:1 문의하기',
  description = '카카오톡 채널로 연결됩니다',
}: KakaoInquiryModalProps) {
  const handleKakaoClick = () => {
    window.open(KAKAO_CHANNEL_URL, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE500]">
            <KakaoIcon className="h-10 w-10 text-[#3C1E1E]" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p className="mb-2 font-medium text-gray-800">안내사항</p>
            <ul className="space-y-1 text-gray-600">
              <li>• 평일 10:00 ~ 18:00 운영</li>
              <li>• 주말/공휴일은 답변이 지연될 수 있습니다</li>
              <li>• 신청 내용과 문의사항을 함께 남겨주세요</li>
            </ul>
          </div>

          <Button
            onClick={handleKakaoClick}
            className="w-full h-12 text-base font-medium bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E]"
          >
            <KakaoIcon className="h-5 w-5 mr-2" />
            카카오톡으로 문의하기
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
