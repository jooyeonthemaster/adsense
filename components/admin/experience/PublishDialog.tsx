import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExperienceBlogger } from '@/types/experience-blogger';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blogger: ExperienceBlogger | null;
  onPublish: (publishUrl: string) => Promise<void>;
}

export function PublishDialog({
  open,
  onOpenChange,
  blogger,
  onPublish,
}: PublishDialogProps) {
  const [publishUrl, setPublishUrl] = useState('');

  const handlePublish = async () => {
    if (!publishUrl) return;
    await onPublish(publishUrl);
    setPublishUrl('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setPublishUrl('');
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>발행 완료 처리 (Step 5)</DialogTitle>
          <DialogDescription>{blogger?.name}님의 발행 URL을 입력하세요</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">발행 URL</label>
            <Input
              value={publishUrl}
              onChange={(e) => setPublishUrl(e.target.value)}
              placeholder="https://blog.naver.com/..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handlePublish}>발행 완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

