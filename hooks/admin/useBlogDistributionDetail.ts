import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { BlogDistributionDetail, DailyRecord, BlogContentItem } from '@/components/admin/blog-distribution-detail/types';
import { distributionTypeConfig } from '@/components/admin/blog-distribution-detail/constants';
import * as XLSX from 'xlsx';

export function useBlogDistributionDetail(submissionId: string) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<BlogDistributionDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [contentItems, setContentItems] = useState<BlogContentItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
    fetchContentItems();
  }, [submissionId]);

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/blog-distribution/${submissionId}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmission(data.submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast({
        title: '오류',
        description: '접수 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyRecords = async () => {
    try {
      const response = await fetch(`/api/admin/blog-distribution/${submissionId}/daily-records`);
      if (response.ok) {
        const data = await response.json();
        setDailyRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching daily records:', error);
    }
  };

  const fetchContentItems = async () => {
    try {
      const response = await fetch(`/api/admin/blog-distribution/${submissionId}/content-items`);
      if (response.ok) {
        const data = await response.json();
        setContentItems(data.contentItems || []);
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/blog-distribution/${submissionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: '상태 변경 완료',
        description: '상태가 변경되었습니다.',
      });
      fetchSubmissionDetail();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 진행률은 content_items 개수 기반으로 계산
  const totalCompletedCount = contentItems.length;
  const completionRate = submission ? Math.round((totalCompletedCount / submission.total_count) * 100) : 0;

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

      if (jsonData.length === 0) {
        toast({
          title: '오류',
          description: '엑셀 파일에 데이터가 없습니다.',
          variant: 'destructive',
        });
        return;
      }

      // 엑셀 데이터를 API 형식으로 변환
      const items = jsonData.map((row) => ({
        blog_title: row['작성제목'] || row['블로그제목'] || row['blog_title'] || row['제목'] || '',
        published_date: row['발행일'] || row['published_date'] || row['날짜'] || '',
        status: row['상태'] || row['status'] || '대기',
        blog_url: row['블로그링크'] || row['블로그URL'] || row['blog_url'] || row['URL'] || '',
        blog_id: row['블로그아이디'] || row['blog_id'] || '',
        keyword: row['키워드'] || row['keyword'] || '',
        notes: row['메모'] || row['notes'] || row['비고'] || '',
      }));

      // API로 업로드
      const response = await fetch(`/api/admin/blog-distribution/${submissionId}/content-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '업로드 실패');
      }

      toast({
        title: '업로드 완료',
        description: result.message || `${items.length}건의 콘텐츠가 업로드되었습니다.`,
      });

      fetchContentItems();
    } catch (error) {
      console.error('Error uploading excel:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '엑셀 파일 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 상태 한글 변환 함수
  const getStatusLabel = (status: string | null) => {
    if (!status) return '대기';
    switch (status) {
      case 'approved': return '승인됨';
      case 'revision_requested': return '수정요청';
      case 'pending':
      default: return '대기';
    }
  };

  // 엑셀 다운로드 핸들러
  const downloadContentItemsAsExcel = () => {
    if (!submission || contentItems.length === 0) {
      toast({
        title: '알림',
        description: '다운로드할 콘텐츠가 없습니다.',
      });
      return;
    }

    // 네이버 리뷰 형식에 맞춘 새 엑셀 형식
    const excelData = contentItems.map((item) => ({
      '접수번호': submission.submission_number || '',
      '업체명': submission.company_name || '',
      '작성제목': item.blog_title || '',
      '발행일': item.published_date || '',
      '상태': getStatusLabel(item.status),
      '블로그링크': item.blog_url || '',
      '블로그아이디': item.blog_id || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
      { wch: 18 },  // 접수번호
      { wch: 20 },  // 업체명
      { wch: 40 },  // 작성제목
      { wch: 12 },  // 발행일
      { wch: 10 },  // 상태
      { wch: 50 },  // 블로그링크
      { wch: 20 },  // 블로그아이디
    ];

    // 배포 타입에 따른 시트명
    const sheetName = distributionTypeConfig[submission.distribution_type]
      ? `${distributionTypeConfig[submission.distribution_type]}배포`
      : '블로그배포';

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fileName = `블로그배포_${submission.submission_number}_${submission.company_name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: '다운로드 완료',
      description: `${contentItems.length}건의 콘텐츠가 다운로드되었습니다.`,
    });
  };

  // 콘텐츠 전체 삭제
  const handleDeleteAllContent = async () => {
    if (!confirm('모든 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog-distribution/${submissionId}/content-items`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      toast({
        title: '삭제 완료',
        description: '모든 콘텐츠가 삭제되었습니다.',
      });

      fetchContentItems();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: '오류',
        description: '콘텐츠 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return {
    loading,
    submission,
    dailyRecords,
    contentItems,
    activeTab,
    uploading,
    totalCompletedCount,
    completionRate,
    fileInputRef,

    setActiveTab,

    fetchSubmissionDetail,
    fetchDailyRecords,
    fetchContentItems,
    handleStatusChange,
    handleFileUpload,
    downloadContentItemsAsExcel,
    handleDeleteAllContent,
  };
}
