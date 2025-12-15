'use client';

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
import { Loader2, Check } from 'lucide-react';
import type { BulkEditDialogState } from './types';

interface BulkEditDialogProps {
  dialog: BulkEditDialogState;
  selectedCount: number;
  onClose: () => void;
  onScriptsChange: (scripts: string) => void;
  onSave: () => Promise<void>;
}

export function BulkEditDialog({
  dialog,
  selectedCount,
  onClose,
  onScriptsChange,
  onSave,
}: BulkEditDialogProps) {
  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>텍스트 일괄 수정 ({selectedCount}개 선택됨)</DialogTitle>
          <DialogDescription>
            선택한 콘텐츠들의 원고를 일괄 수정합니다. 각 원고는 &quot;---&quot;로 구분해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">원고 ({selectedCount}개)</label>
              <span className="text-xs text-muted-foreground">
                각 원고 사이에 &quot;---&quot; 구분자를 넣어주세요
              </span>
            </div>
            <Textarea
              value={dialog.scripts}
              onChange={(e) => onScriptsChange(e.target.value)}
              placeholder={`첫 번째 원고 내용...\n---\n두 번째 원고 내용...\n---\n세 번째 원고 내용...`}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={dialog.isSaving}>
            취소
          </Button>
          <Button onClick={onSave} disabled={dialog.isSaving} className="bg-amber-600 hover:bg-amber-700">
            {dialog.isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                일괄 저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
