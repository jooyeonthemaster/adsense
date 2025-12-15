'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Check } from 'lucide-react';
import type { EditDialogState } from './types';

interface EditContentDialogProps {
  dialog: EditDialogState;
  onClose: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScriptChange: (script: string) => void;
  onSave: () => Promise<void>;
}

export function EditContentDialog({
  dialog,
  onClose,
  onImageChange,
  onScriptChange,
  onSave,
}: EditContentDialogProps) {
  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>콘텐츠 #{dialog.item?.upload_order} 수정</DialogTitle>
          <DialogDescription>원고를 수정할 수 있습니다</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">이미지 (선택)</label>
            <Input type="file" accept="image/*" onChange={onImageChange} />
            {(dialog.editedImagePreview || dialog.item?.image_url) && (
              <div className="aspect-video bg-muted rounded-md overflow-hidden max-w-xs">
                <img
                  src={dialog.editedImagePreview || dialog.item?.image_url}
                  alt="미리보기"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">원고</label>
            <Textarea
              value={dialog.editedScript}
              onChange={(e) => onScriptChange(e.target.value)}
              placeholder="원고를 입력하세요..."
              className="min-h-[200px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={dialog.isSaving}>
            취소
          </Button>
          <Button onClick={onSave} disabled={dialog.isSaving}>
            {dialog.isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                수정 저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
