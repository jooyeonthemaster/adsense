'use client';

import { Client } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  Calendar,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ClientDetailDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDialog({
  client,
  open,
  onOpenChange,
}: ClientDetailDialogProps) {
  const hasBusinessInfo = client.business_license_url || client.tax_email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {client.company_name} 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              기본 정보
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">아이디</p>
                <p className="font-medium">{client.username}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">상태</p>
                <Badge variant={client.is_active ? 'default' : 'secondary'}>
                  {client.is_active ? '활성' : '비활성'}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">담당자</p>
                <p className="font-medium">{client.contact_person || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">연락처</p>
                <p className="font-medium flex items-center gap-1">
                  {client.phone ? (
                    <>
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">포인트</p>
                <p className="font-bold text-primary">
                  {client.points.toLocaleString()} P
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">가입일</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(client.created_at), 'yyyy-MM-dd', { locale: ko })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">인증 방식</p>
                <Badge variant="outline">
                  {client.auth_provider === 'kakao' ? '카카오' : '일반'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* 사업자 정보 */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              사업자 정보
              {!hasBusinessInfo && (
                <Badge variant="secondary" className="ml-2">미등록</Badge>
              )}
            </h3>

            {hasBusinessInfo ? (
              <div className="space-y-4">
                <div className="grid gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">세금계산서 수령 이메일</p>
                    <p className="font-medium flex items-center gap-1">
                      {client.tax_email ? (
                        <>
                          <Mail className="h-3 w-3" />
                          {client.tax_email}
                        </>
                      ) : (
                        '-'
                      )}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* 사업자등록증 */}
                <div>
                  <p className="text-muted-foreground mb-2 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    사업자등록증
                  </p>
                  {client.business_license_url ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                      <FileText className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-sm text-green-700 flex-1 min-w-0 truncate">
                        {client.business_license_name || '업로드됨'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => window.open(client.business_license_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        보기
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        업로드된 사업자등록증이 없습니다
                      </span>
                    </div>
                  )}
                </div>

                {client.profile_updated_at && (
                  <p className="text-xs text-muted-foreground">
                    마지막 수정: {format(new Date(client.profile_updated_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">등록된 사업자 정보가 없습니다</p>
                <p className="text-xs mt-1">고객이 마이페이지에서 정보를 등록하면 여기에 표시됩니다</p>
              </div>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
