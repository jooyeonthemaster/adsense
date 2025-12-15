'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { SubmissionTableRow } from './SubmissionTableRow';
import type { SubmissionWithClient, GroupedItem } from './types';

interface GroupViewProps {
  groups: GroupedItem[];
  expandedGroups: Set<string>;
  copiedId: string | null;
  onToggleGroup: (groupName: string) => void;
  onCopy: (submissionNumber: string) => void;
  onStatusChange: (submission: SubmissionWithClient) => void;
  formatDate: (dateString: string) => string;
}

export function GroupView({
  groups,
  expandedGroups,
  copiedId,
  onToggleGroup,
  onCopy,
  onStatusChange,
  formatDate,
}: GroupViewProps) {
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
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base lg:text-lg truncate">
                        {group.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs truncate">
                        {group.count}개 • 진행중 {group.inProgress} • 완료 {group.completed}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm sm:text-lg lg:text-xl font-bold text-sky-600">
                        {group.totalCount.toLocaleString()}건
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                        총 배포 수량
                      </p>
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
                        <TableHead>접수번호</TableHead>
                        <TableHead>타입</TableHead>
                        <TableHead>업체명</TableHead>
                        <TableHead className="text-center">일 배포</TableHead>
                        <TableHead className="text-center">총 수량</TableHead>
                        <TableHead>키워드</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-center">진행률</TableHead>
                        <TableHead>접수일</TableHead>
                        <TableHead className="text-center">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((sub) => (
                        <SubmissionTableRow
                          key={sub.id}
                          submission={sub}
                          copiedId={copiedId}
                          onCopy={onCopy}
                          onStatusChange={onStatusChange}
                          formatDate={formatDate}
                          showClient={false}
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
