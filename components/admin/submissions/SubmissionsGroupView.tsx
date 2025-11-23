import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building2, ChevronDown } from 'lucide-react';
import { UnifiedSubmission } from '@/types/admin/submissions';
import { SubmissionTableRow } from './SubmissionTableRow';

interface GroupData {
  name: string;
  items: UnifiedSubmission[];
  totalPoints: number;
  count: number;
  inProgress: number;
  completed: number;
}

interface SubmissionsGroupViewProps {
  groups: GroupData[];
  expandedGroups: Set<string>;
  groupBy: 'client' | 'type';
  onToggleGroup: (groupName: string) => void;
  onOpenDetail: (id: string, type: UnifiedSubmission['type']) => void;
}

export function SubmissionsGroupView({
  groups,
  expandedGroups,
  groupBy,
  onToggleGroup,
  onOpenDetail,
}: SubmissionsGroupViewProps) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <Collapsible
          key={group.name}
          open={expandedGroups.has(group.name)}
          onOpenChange={() => onToggleGroup(group.name)}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base lg:text-lg truncate">{group.name}</CardTitle>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {group.count}개 • 진행중 {group.inProgress} • 완료 {group.completed}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm sm:text-lg lg:text-xl font-bold text-primary">{group.totalPoints.toLocaleString()} P</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">총 사용 포인트</p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                        expandedGroups.has(group.name) ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">접수일시</TableHead>
                        {groupBy === 'type' && <TableHead className="w-[120px]">거래처</TableHead>}
                        {groupBy === 'client' && <TableHead className="w-[140px]">상품유형</TableHead>}
                        <TableHead className="w-[150px]">업체명</TableHead>
                        <TableHead className="min-w-[250px]">상세내용</TableHead>
                        <TableHead className="w-[80px]">진행률</TableHead>
                        <TableHead className="w-[100px] text-right">사용 포인트</TableHead>
                        <TableHead className="w-[100px]">상태</TableHead>
                        <TableHead className="w-[80px]">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((submission) => (
                        <SubmissionTableRow
                          key={`${submission.type}-${submission.id}`}
                          submission={submission}
                          onOpenDetail={onOpenDetail}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}

