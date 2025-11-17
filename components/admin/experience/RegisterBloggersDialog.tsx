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
import { Plus, Trash2, Download, Upload, Save, Loader2 } from 'lucide-react';
import { NewBlogger } from '@/types/experience-blogger';
import { downloadBloggerExcelTemplate, parseBloggerExcelFile } from '@/lib/excel-blogger-utils';
import { useToast } from '@/hooks/use-toast';

interface RegisterBloggersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (bloggers: NewBlogger[]) => Promise<void>;
  loading: boolean;
  existingBloggersCount: number;
  onReuploadConfirm: (bloggers: NewBlogger[]) => void;
}

export function RegisterBloggersDialog({
  open,
  onOpenChange,
  onRegister,
  loading,
  existingBloggersCount,
  onReuploadConfirm,
}: RegisterBloggersDialogProps) {
  const { toast } = useToast();
  const [newBloggers, setNewBloggers] = useState<NewBlogger[]>([
    { name: '', blog_url: '', index_score: 0 },
  ]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    parseBloggerExcelFile(
      file,
      (parsedBloggers) => {
        if (existingBloggersCount > 0) {
          // Show reupload confirmation
          onReuploadConfirm(parsedBloggers);
        } else {
          setNewBloggers(parsedBloggers);
          toast({
            title: '엑셀 파일 업로드 완료',
            description: `${parsedBloggers.length}명의 블로거 정보를 불러왔습니다.`,
          });
        }
      },
      (errorMessage) => {
        toast({
          title: '업로드 실패',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    );

    // Reset file input
    e.target.value = '';
  };

  const handleRegister = async () => {
    const validBloggers = newBloggers.filter(
      (b) => b.name && b.blog_url && b.index_score > 0
    );

    if (validBloggers.length === 0) {
      toast({
        title: '입력 오류',
        description: '최소 1명의 블로거 정보를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    await onRegister(validBloggers);
    setNewBloggers([{ name: '', blog_url: '', index_score: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>블로거 등록 (Step 1)</DialogTitle>
          <DialogDescription>체험단에 참여할 블로거 목록을 등록하세요</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Excel Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">엑셀 파일로 일괄 등록</p>
                <p className="text-xs text-gray-500 mt-1">
                  형식: 이름 | 블로그 URL | 블로그 지수 (첫 행은 헤더)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadBloggerExcelTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  양식 다운로드
                </Button>
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <Button type="button" variant="secondary" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      엑셀 업로드
                    </span>
                  </Button>
                </label>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Manual Input */}
          {newBloggers.map((blogger, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4">
                <label className="text-sm font-medium">이름</label>
                <Input
                  value={blogger.name}
                  onChange={(e) => {
                    const updated = [...newBloggers];
                    updated[index].name = e.target.value;
                    setNewBloggers(updated);
                  }}
                  placeholder="블로거 이름"
                />
              </div>
              <div className="col-span-5">
                <label className="text-sm font-medium">블로그 URL</label>
                <Input
                  value={blogger.blog_url}
                  onChange={(e) => {
                    const updated = [...newBloggers];
                    updated[index].blog_url = e.target.value;
                    setNewBloggers(updated);
                  }}
                  placeholder="https://blog.naver.com/..."
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">블로그 지수</label>
                <Input
                  type="number"
                  value={blogger.index_score || ''}
                  onChange={(e) => {
                    const updated = [...newBloggers];
                    updated[index].index_score = parseInt(e.target.value) || 0;
                    setNewBloggers(updated);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="col-span-1">
                {newBloggers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewBloggers(newBloggers.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              setNewBloggers([...newBloggers, { name: '', blog_url: '', index_score: 0 }]);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            블로거 추가
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button onClick={handleRegister} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                등록 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                등록 완료
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

