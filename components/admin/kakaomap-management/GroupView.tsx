import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Building2, ChevronDown, MessageSquare } from 'lucide-react';
import { SubmissionRow } from './SubmissionRow';
import type { GroupedData, KakaomapSubmission } from './types';

interface GroupViewProps {
  groups: GroupedData[];
  expandedGroups: Set<string>;
  copiedId: string | null;
  onToggleGroup: (groupName: string) => void;
  onCopy: (submissionNumber: string) => void;
  getProgressPercentage: (sub: KakaomapSubmission) => number;
  getProgressBarWidth: (sub: KakaomapSubmission) => number;
}

export function GroupView({
  groups,
  expandedGroups,
  copiedId,
  onToggleGroup,
  onCopy,
  getProgressPercentage,
  getProgressBarWidth,
}: GroupViewProps) {
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
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>
                        {group.count}개 캠페인 · {group.totalCost.toLocaleString()}P
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <Badge variant="default">{group.inProgress}개 진행중</Badge>
                      <Badge variant="secondary">{group.completed}개 완료</Badge>
                      {group.needsUpload > 0 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          {group.needsUpload}개 업로드 필요
                        </Badge>
                      )}
                      {group.unreadMessages > 0 && (
                        <Badge variant="destructive">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {group.unreadMessages}
                        </Badge>
                      )}
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
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>접수번호</TableHead>
                        <TableHead>상품명</TableHead>
                        <TableHead className="text-center">상태</TableHead>
                        <TableHead className="text-center">콘텐츠 진행</TableHead>
                        <TableHead className="text-center">수량</TableHead>
                        <TableHead className="text-center">옵션</TableHead>
                        <TableHead className="text-right">비용</TableHead>
                        <TableHead className="text-center">알림</TableHead>
                        <TableHead className="text-center">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((sub) => (
                        <SubmissionRow
                          key={sub.id}
                          submission={sub}
                          copiedId={copiedId}
                          showClient={false}
                          onCopy={onCopy}
                          getProgressPercentage={getProgressPercentage}
                          getProgressBarWidth={getProgressBarWidth}
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
