import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { XCircle, Send, AlertCircle } from 'lucide-react';
import { ContentItem } from '@/types/review/kmap-content';

interface RevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentItem: ContentItem | null;
  onSubmit: (message: string) => Promise<void>;
  isProcessing: boolean;
}

export function RevisionDialog({
  open,
  onOpenChange,
  contentItem,
  onSubmit,
  isProcessing,
}: RevisionDialogProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    await onSubmit(message.trim());
    setMessage('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            수정 요청
          </DialogTitle>
          <DialogDescription>
            {contentItem && (
              <>
                콘텐츠 #{contentItem.upload_order}에 대한 수정 사항을 입력해주세요.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              수정 요청 사항 <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="수정이 필요한 부분을 구체적으로 작성해주세요.&#10;예: 이미지가 너무 어둡습니다. 더 밝게 조정해주세요."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} / 500자
            </p>
          </div>

          {message.trim() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">수정 요청 안내</p>
                  <p>관리자가 수정 후 다시 업로드하면 재검수가 필요합니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            취소
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleSubmit}
            disabled={!message.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                전송 중...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                수정 요청 보내기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






