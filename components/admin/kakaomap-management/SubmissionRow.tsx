import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  ExternalLink,
  MessageSquare,
  Image,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { KAKAOMAP_STATUS_LABELS } from '@/config/kakaomap-status';
import { starRatingConfig, scriptTypeConfig } from './constants';
import type { KakaomapSubmission } from './types';

interface SubmissionRowProps {
  submission: KakaomapSubmission;
  copiedId: string | null;
  showClient?: boolean;
  onCopy: (submissionNumber: string) => void;
  getProgressPercentage: (sub: KakaomapSubmission) => number;
  getProgressBarWidth: (sub: KakaomapSubmission) => number;
}

export function SubmissionRow({
  submission: sub,
  copiedId,
  showClient = false,
  onCopy,
  getProgressPercentage,
  getProgressBarWidth,
}: SubmissionRowProps) {
  return (
    <TableRow>
      {/* 접수번호 */}
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="text-sm font-mono text-muted-foreground">
            {sub.submission_number || '-'}
          </span>
          {sub.submission_number && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onCopy(sub.submission_number)}
            >
              {copiedId === sub.submission_number ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </TableCell>

      {/* 거래처 (List View only) */}
      {showClient && (
        <TableCell>
          <div className="flex flex-col">
            <div className="font-medium">{sub.clients?.company_name || '-'}</div>
            {sub.clients?.contact_person && (
              <div className="text-xs text-muted-foreground">{sub.clients.contact_person}</div>
            )}
          </div>
        </TableCell>
      )}

      {/* 상품명 */}
      <TableCell>
        <div className="flex flex-col max-w-[200px]">
          <div className="font-medium truncate">{sub.company_name}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(sub.created_at).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </TableCell>

      {/* 상태 */}
      <TableCell className="text-center">
        <Badge variant={KAKAOMAP_STATUS_LABELS[sub.status as keyof typeof KAKAOMAP_STATUS_LABELS]?.variant || 'outline'}>
          {KAKAOMAP_STATUS_LABELS[sub.status as keyof typeof KAKAOMAP_STATUS_LABELS]?.label || sub.status}
        </Badge>
      </TableCell>

      {/* 콘텐츠 진행 */}
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            <span className="text-sm font-medium">
              {sub.completed_count || 0} / {sub.total_count}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary rounded-full h-1.5 transition-all"
              style={{ width: `${getProgressBarWidth(sub)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {getProgressPercentage(sub)}%
          </span>
        </div>
      </TableCell>

      {/* 수량 */}
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium">{sub.total_count}타</span>
          <span className="text-xs text-muted-foreground">
            {sub.daily_count}타/일
          </span>
        </div>
      </TableCell>

      {/* 옵션 */}
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          {sub.script_type && scriptTypeConfig[sub.script_type] && (
            <Badge variant="outline" className={`text-xs ${scriptTypeConfig[sub.script_type].color}`}>
              {scriptTypeConfig[sub.script_type].label}
            </Badge>
          )}
          {sub.has_photo && (
            <Badge variant="outline" className="text-xs">
              사진 {sub.photo_ratio}%
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {starRatingConfig[sub.star_rating]?.label || sub.star_rating}
          </Badge>
        </div>
      </TableCell>

      {/* 비용 */}
      <TableCell className="text-right font-medium">
        {sub.total_points.toLocaleString()}P
      </TableCell>

      {/* 알림 */}
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          {sub.unread_messages_count > 0 && (
            <Badge variant="destructive" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              {sub.unread_messages_count}
            </Badge>
          )}
          {sub.pending_revision_count > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              수정 {sub.pending_revision_count}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* 관리 */}
      <TableCell className="text-center">
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/kakaomap/${sub.id}`}>
            관리
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
