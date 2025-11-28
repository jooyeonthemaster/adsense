import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Building2, ChevronDown } from 'lucide-react';
import { SubmissionWithClient } from '@/types/admin/cafe-marketing';
import { CafeMarketingTableRow } from './CafeMarketingTableRow';

interface GroupData {
  name: string;
  items: SubmissionWithClient[];
  totalCount: number;
  count: number;
  inProgress: number;
  completed: number;
}

interface CafeMarketingGroupViewProps {
  groups: GroupData[];
  expandedGroups: Set<string>;
  updatingStatusId: string | null;
  onToggleGroup: (groupName: string) => void;
  onStatusSelect: (submission: SubmissionWithClient, status: SubmissionWithClient['status']) => void;
  onScriptChange: (submission: SubmissionWithClient) => void;
  onDailyRecordOpen: (submission: SubmissionWithClient) => void;
}

export function CafeMarketingGroupView({
  groups,
  expandedGroups,
  updatingStatusId,
  onToggleGroup,
  onStatusSelect,
  onScriptChange,
  onDailyRecordOpen,
}: CafeMarketingGroupViewProps) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Collapsible
          key={group.name}
          open={expandedGroups.has(group.name)}
          onOpenChange={() => onToggleGroup(group.name)}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-amber-500" />
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>
                        {group.count}개 접수 • 진행중 {group.inProgress}개 • 완료 {group.completed}개
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-600">{group.totalCount.toLocaleString()}건</p>
                      <p className="text-xs text-gray-500">총 발행 건수</p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
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
                        <TableHead>업체명</TableHead>
                        <TableHead>거래처</TableHead>
                        <TableHead>지역</TableHead>
                        <TableHead className="text-center">카페 수</TableHead>
                        <TableHead className="text-center">발행 건수</TableHead>
                        <TableHead>진행 상태</TableHead>
                        <TableHead className="text-center">진행률</TableHead>
                        <TableHead>접수일</TableHead>
                        <TableHead className="text-center">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((sub) => (
                        <CafeMarketingTableRow
                          key={sub.id}
                          submission={sub}
                          updatingStatusId={updatingStatusId}
                          onStatusSelect={onStatusSelect}
                          onScriptChange={onScriptChange}
                          onDailyRecordOpen={onDailyRecordOpen}
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




