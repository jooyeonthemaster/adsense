import { useState, useEffect } from 'react';
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
import { Plus, Trash2, Save } from 'lucide-react';
import { ExperienceBlogger, KeywordRanking } from '@/types/experience-blogger';
import { useToast } from '@/hooks/use-toast';

interface RankingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blogger: ExperienceBlogger | null;
  onSave: (rankings: KeywordRanking[]) => Promise<void>;
}

export function RankingsDialog({
  open,
  onOpenChange,
  blogger,
  onSave,
}: RankingsDialogProps) {
  const { toast } = useToast();
  const [rankings, setRankings] = useState<KeywordRanking[]>([{ keyword: '', rank: 0 }]);

  useEffect(() => {
    if (open && blogger) {
      setRankings(
        blogger.keyword_rankings?.map((r) => ({ keyword: r.keyword, rank: r.rank })) || [
          { keyword: '', rank: 0 },
        ]
      );
    }
  }, [open, blogger]);

  const handleSave = async () => {
    const validRankings = rankings.filter((r) => r.keyword && r.rank > 0);

    if (validRankings.length === 0) {
      toast({
        title: '입력 오류',
        description: '최소 1개의 키워드 순위를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    await onSave(validRankings);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setRankings([{ keyword: '', rank: 0 }]);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>키워드 순위 등록 (Step 6)</DialogTitle>
          <DialogDescription>{blogger?.name}님의 키워드 순위를 입력하세요</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {rankings.map((ranking, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-7">
                <label className="text-sm font-medium">키워드</label>
                <Input
                  value={ranking.keyword}
                  onChange={(e) => {
                    const updated = [...rankings];
                    updated[index].keyword = e.target.value;
                    setRankings(updated);
                  }}
                  placeholder="예: 강남역 맛집"
                />
              </div>
              <div className="col-span-4">
                <label className="text-sm font-medium">순위</label>
                <Input
                  type="number"
                  value={ranking.rank || ''}
                  onChange={(e) => {
                    const updated = [...rankings];
                    updated[index].rank = parseInt(e.target.value) || 0;
                    setRankings(updated);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="col-span-1">
                {rankings.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRankings(rankings.filter((_, i) => i !== index));
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
              setRankings([...rankings, { keyword: '', rank: 0 }]);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            키워드 추가
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            순위 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

