'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, DollarSign, Settings, Key } from 'lucide-react';
import Link from 'next/link';
import { EditClientDialog } from './edit-client-dialog';
import { DeleteClientDialog } from './delete-client-dialog';
import { PointManagementDialog } from './point-management-dialog';
import { ResetPasswordDialog } from './reset-password-dialog';

interface ClientsTableProps {
  clients: Client[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pointDialogOpen, setPointDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>(clients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    let filtered = [...clients];

    // 검색 필터 (회사명, 담당자)
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter((c) => c.is_active === isActive);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.company_name.localeCompare(b.company_name, 'ko');
        case 'name-desc':
          return b.company_name.localeCompare(a.company_name, 'ko');
        case 'points-desc':
          return (b.points || 0) - (a.points || 0);
        case 'points-asc':
          return (a.points || 0) - (b.points || 0);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredClients(filtered);
  }, [searchTerm, statusFilter, sortBy, clients]);

  if (clients.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <p className="text-muted-foreground">등록된 거래처가 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 필터 영역 - 반응형 */}
      <div className="mb-4 sm:mb-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <div className="grid gap-1.5 sm:gap-2">
          <Label htmlFor="search" className="text-xs sm:text-sm">검색</Label>
          <Input
            id="search"
            placeholder="회사명, 담당자, 아이디..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 sm:h-10 text-xs sm:text-sm"
          />
        </div>
        <div className="grid gap-1.5 sm:gap-2">
          <Label htmlFor="status-filter" className="text-xs sm:text-sm">상태</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" className="h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs sm:text-sm">전체</SelectItem>
              <SelectItem value="active" className="text-xs sm:text-sm">활성</SelectItem>
              <SelectItem value="inactive" className="text-xs sm:text-sm">비활성</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5 sm:gap-2">
          <Label htmlFor="sort-by" className="text-xs sm:text-sm">정렬</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-by" className="h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="최신순" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent" className="text-xs sm:text-sm">최신순</SelectItem>
              <SelectItem value="oldest" className="text-xs sm:text-sm">오래된순</SelectItem>
              <SelectItem value="name-asc" className="text-xs sm:text-sm">가나다순</SelectItem>
              <SelectItem value="name-desc" className="text-xs sm:text-sm">가나다역순</SelectItem>
              <SelectItem value="points-desc" className="text-xs sm:text-sm">포인트 많은순</SelectItem>
              <SelectItem value="points-asc" className="text-xs sm:text-sm">포인트 적은순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 sm:p-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">조건에 맞는 거래처가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 모바일: 카드 레이아웃 */}
          <div className="md:hidden space-y-3">
            {filteredClients.map((client) => (
              <div key={client.id} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{client.company_name}</p>
                    <p className="text-xs text-muted-foreground">@{client.username}</p>
                  </div>
                  <Badge variant={client.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {client.is_active ? '활성' : '비활성'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">담당자</p>
                    <p className="font-medium">{client.contact_person || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">연락처</p>
                    <p className="font-medium">{client.phone || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm font-bold text-primary">
                    {client.points.toLocaleString()} P
                  </p>
                  <div className="flex gap-1">
                    <Link href={`/admin/clients/${client.id}/pricing`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="가격 설정">
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="포인트 관리"
                      onClick={() => {
                        setSelectedClient(client);
                        setPointDialogOpen(true);
                      }}
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="비밀번호 재설정"
                      onClick={() => {
                        setSelectedClient(client);
                        setPasswordDialogOpen(true);
                      }}
                    >
                      <Key className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="거래처 수정"
                      onClick={() => {
                        setSelectedClient(client);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="거래처 삭제"
                      onClick={() => {
                        setSelectedClient(client);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 데스크탑: 테이블 레이아웃 */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs lg:text-sm whitespace-nowrap">아이디</TableHead>
                  <TableHead className="text-xs lg:text-sm whitespace-nowrap">회사명</TableHead>
                  <TableHead className="text-xs lg:text-sm whitespace-nowrap">담당자</TableHead>
                  <TableHead className="text-xs lg:text-sm whitespace-nowrap">연락처</TableHead>
                  <TableHead className="text-xs lg:text-sm whitespace-nowrap">포인트</TableHead>
                  <TableHead className="text-xs lg:text-sm whitespace-nowrap">상태</TableHead>
                  <TableHead className="text-right text-xs lg:text-sm whitespace-nowrap">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium text-xs lg:text-sm whitespace-nowrap">
                      {client.username}
                    </TableCell>
                    <TableCell className="text-xs lg:text-sm whitespace-nowrap">
                      {client.company_name}
                    </TableCell>
                    <TableCell className="text-xs lg:text-sm whitespace-nowrap">
                      {client.contact_person || '-'}
                    </TableCell>
                    <TableCell className="text-xs lg:text-sm whitespace-nowrap">
                      {client.phone || '-'}
                    </TableCell>
                    <TableCell className="font-semibold text-xs lg:text-sm whitespace-nowrap">
                      {client.points.toLocaleString()} P
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? 'default' : 'secondary'} className="text-xs">
                        {client.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 lg:gap-2">
                        <Link href={`/admin/clients/${client.id}/pricing`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9" title="가격 설정">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          title="포인트 관리"
                          onClick={() => {
                            setSelectedClient(client);
                            setPointDialogOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          title="비밀번호 재설정"
                          onClick={() => {
                            setSelectedClient(client);
                            setPasswordDialogOpen(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          title="거래처 수정"
                          onClick={() => {
                            setSelectedClient(client);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          title="거래처 삭제"
                          onClick={() => {
                            setSelectedClient(client);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {selectedClient && (
        <>
          <EditClientDialog
            client={selectedClient}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteClientDialog
            client={selectedClient}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
          <PointManagementDialog
            client={selectedClient}
            open={pointDialogOpen}
            onOpenChange={setPointDialogOpen}
          />
          <ResetPasswordDialog
            client={selectedClient}
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
          />
        </>
      )}
    </>
  );
}
