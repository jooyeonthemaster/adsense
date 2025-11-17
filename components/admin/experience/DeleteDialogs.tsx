import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Upload, Loader2 } from 'lucide-react';

interface DeleteBloggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bloggerName: string;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export function DeleteBloggerDialog({
  open,
  onOpenChange,
  bloggerName,
  onConfirm,
  loading,
}: DeleteBloggerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>블로거 삭제 확인</DialogTitle>
          <DialogDescription>
            {bloggerName} 블로거를 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
  loading,
}: BulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>일괄 삭제 확인</DialogTitle>
          <DialogDescription>
            선택된 {count}명의 블로거를 삭제하시겠습니까?
            <br />
            발행된 블로거는 삭제되지 않습니다.
            <br />이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                일괄 삭제
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReuploadConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export function ReuploadConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: ReuploadConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>파일 재등록 확인</DialogTitle>
          <DialogDescription>
            새 파일을 업로드하면 기존에 등록된 블로거 정보가 모두 삭제됩니다.
            <br />
            (발행된 블로거는 삭제되지 않습니다)
            <br />
            <br />
            계속하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button onClick={onConfirm} disabled={loading} variant="destructive">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                재등록 중...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                재등록
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

