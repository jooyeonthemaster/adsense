'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, FileText, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HistoryItem {
  id: string;
  guide_id: string;
  section_id: string | null;
  action: string;
  content_snapshot: any;
  changed_by: string;
  changed_at: string;
}

export default function ProductGuidesHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: API 구현 후 실제 데이터 가져오기
    setLoading(false);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return '생성됨';
      case 'updated':
        return '수정됨';
      case 'deleted':
        return '삭제됨';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <History className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">가이드 수정 이력</h1>
          <p className="text-sm text-muted-foreground">
            상품 가이드의 모든 변경 이력을 확인할 수 있습니다
          </p>
        </div>
      </div>

      <Card className="p-6">
        <ScrollArea className="h-[calc(100vh-250px)]">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>로딩 중...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>수정 이력이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getActionIcon(item.action)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{getActionLabel(item.action)}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.changed_at), 'yyyy-MM-dd HH:mm', {
                            locale: ko,
                          })}
                        </span>
                      </div>
                      {item.content_snapshot && (
                        <div className="text-sm">
                          <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                            {JSON.stringify(item.content_snapshot, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}




