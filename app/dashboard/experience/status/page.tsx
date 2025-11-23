'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  Filter,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { getExperienceStep } from '@/lib/submission-utils';
import { SubmissionStatus } from '@/types/submission';

interface ExperienceSubmission {
  id: string;
  product_type: 'experience';
  company_name: string;
  place_url?: string;
  experience_type: string;
  team_count: number;
  keywords?: string[];
  bloggers_registered: boolean;
  bloggers_selected: boolean;
  schedule_confirmed: boolean;
  client_confirmed: boolean;
  all_published: boolean;
  campaign_completed: boolean;
  total_points: number;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'outline' | 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: '확인중', variant: 'outline' },
  in_progress: { label: '진행중', variant: 'default' },
  completed: { label: '완료', variant: 'secondary' },
  cancelled: { label: '중단됨', variant: 'destructive' },
};

const experienceTypeConfig: Record<string, { label: string; color: string }> = {
  'blog-experience': { label: '블로그 체험단', color: 'violet' },
  'xiaohongshu': { label: '샤오홍슈', color: 'red' },
  'journalist': { label: '기자단', color: 'blue' },
  'influencer': { label: '인플루언서', color: 'purple' },
};

export default function ExperienceMarketingStatusPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ExperienceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'cost'>('date');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/client/experience');
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and sort submissions
  let filteredSubmissions = submissions;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredSubmissions = filteredSubmissions.filter((s) =>
      s.company_name.toLowerCase().includes(query)
    );
  }

  if (statusFilter !== 'all') {
    filteredSubmissions = filteredSubmissions.filter((s) => s.status === statusFilter);
  }

  if (typeFilter !== 'all') {
    filteredSubmissions = filteredSubmissions.filter((s) => s.experience_type === typeFilter);
  }

  if (sortBy === 'cost') {
    filteredSubmissions = [...filteredSubmissions].sort((a, b) => b.total_points - a.total_points);
  } else {
    filteredSubmissions = [...filteredSubmissions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const stats = {
    total: submissions.length,
    in_progress: submissions.filter((s) => ['pending', 'in_progress'].includes(s.status)).length,
    completed: submissions.filter((s) => s.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-3 lg:p-6">
      <div className="space-y-3 sm:space-y-4">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg p-3 sm:p-4 lg:p-6 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold truncate">체험단 마케팅 접수 현황</h1>
              </div>
              <p className="text-[11px] sm:text-sm text-violet-100 truncate">블로거/인플루언서 체험단 접수 내역을 관리하세요</p>
            </div>
            <Link href="/dashboard/experience" className="flex-shrink-0">
              <Button variant="secondary" size="sm" className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                새 접수
              </Button>
            </Link>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 sm:p-3 rounded-lg border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">총 접수</p>
                <p className="text-lg sm:text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg border border-violet-200 bg-violet-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-violet-600 mb-0.5">진행중</p>
                <p className="text-lg sm:text-xl font-bold text-violet-900">{stats.in_progress}</p>
              </div>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-lg border border-green-200 bg-green-50 shadow-sm">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-green-600 mb-0.5">완료</p>
                <p className="text-lg sm:text-xl font-bold text-green-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="업체명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs sm:text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-32 h-8 text-xs sm:text-sm">
              <SelectValue placeholder="전체 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="blog-experience">블로그 체험단</SelectItem>
              <SelectItem value="xiaohongshu">샤오홍슈</SelectItem>
              <SelectItem value="journalist">기자단</SelectItem>
              <SelectItem value="influencer">인플루언서</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-28 h-8 text-xs sm:text-sm">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">확인중</SelectItem>
              <SelectItem value="in_progress">진행중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'cost')}>
            <SelectTrigger className="w-full sm:w-28 h-8 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">접수일순</SelectItem>
              <SelectItem value="cost">비용순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        <div className="hidden md:block bg-white border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold">업체명</TableHead>
                <TableHead className="text-xs font-semibold">체험단 유형</TableHead>
                <TableHead className="text-xs font-semibold">인원</TableHead>
                <TableHead className="text-xs font-semibold">키워드</TableHead>
                <TableHead className="text-xs font-semibold">진행 단계</TableHead>
                <TableHead className="text-xs font-semibold">진행 상태</TableHead>
                <TableHead className="text-xs font-semibold">접수일</TableHead>
                <TableHead className="text-xs font-semibold text-right">비용</TableHead>
                <TableHead className="text-xs font-semibold text-center">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-sm text-gray-500">
                    접수 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => {
                  const statusDisplay = statusConfig[sub.status] || statusConfig.pending;
                  const expType = experienceTypeConfig[sub.experience_type];
                  const { step: currentStep, totalSteps } = getExperienceStep(sub);

                  return (
                    <TableRow key={sub.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {sub.company_name}
                          {sub.place_url && (
                            <a
                              href={sub.place_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-500"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs bg-${expType?.color}-50 text-${expType?.color}-700`}
                        >
                          {expType?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{sub.team_count}명</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-wrap gap-1">
                          {sub.keywords?.slice(0, 2).map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                          {(sub.keywords?.length || 0) > 2 && (
                            <span className="text-xs text-gray-500">
                              +{(sub.keywords?.length || 0) - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className="text-xs">
                          {currentStep}/{totalSteps} 단계
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusDisplay.variant} className="text-xs">
                          {statusDisplay.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(sub.created_at)}</TableCell>
                      <TableCell className="text-sm font-semibold text-right">
                        {sub.total_points.toLocaleString()}P
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/experience/detail/${sub.id}`)}
                          className="h-7 text-xs text-violet-600 border-violet-300"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 모바일 카드 */}
        <div className="md:hidden space-y-2">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 bg-white border rounded-lg">
              <p className="text-xs text-gray-500">접수 내역이 없습니다.</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const statusDisplay = statusConfig[sub.status] || statusConfig.pending;
              const expType = experienceTypeConfig[sub.experience_type];
              const { step: currentStep, totalSteps } = getExperienceStep(sub);

              return (
                <div key={sub.id} className="bg-white border rounded-lg p-2.5 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-xs truncate flex-1 min-w-0">{sub.company_name}</h3>
                    <Badge variant={statusDisplay.variant} className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                      {statusDisplay.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      {expType?.label}
                    </Badge>
                    <span className="text-xs text-gray-600">{sub.team_count}명</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      {currentStep}/{totalSteps} 단계
                    </Badge>
                  </div>
                  {sub.keywords && sub.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {sub.keywords.slice(0, 3).map((kw, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">접수일</p>
                      <p className="text-xs font-medium">{formatDate(sub.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">비용</p>
                      <p className="text-xs font-semibold text-violet-600">
                        {sub.total_points.toLocaleString()}P
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/experience/detail/${sub.id}`)}
                    className="w-full text-[11px] h-7 text-violet-600 border-violet-300 px-2"
                  >
                    <Eye className="h-2.5 w-2.5 mr-0.5" />
                    상세
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
