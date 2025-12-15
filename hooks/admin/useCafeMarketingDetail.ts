import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { CafeMarketingDetail, DailyRecord, ContentItem } from '@/components/admin/cafe-marketing-detail/types';
import { contentStatusConfig } from '@/components/admin/cafe-marketing-detail/constants';
import * as XLSX from 'xlsx';

export function useCafeMarketingDetail(submissionId: string) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<CafeMarketingDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
    fetchContentItems();
  }, [submissionId]);

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/cafe-marketing/${submissionId}`);
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
      const response = await fetch(`/api/admin/cafe-marketing/${submissionId}/daily-records`);
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
      const response = await fetch(`/api/admin/cafe-marketing/${submissionId}/content-items`);
      if (response.ok) {
        const data = await response.json();
        setContentItems(data.contentItems || []);
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast({
          title: '오류',
          description: '엑셀 파일에 데이터가 없습니다.',
          variant: 'destructive',
        });
        return;
      }

      // 엑셀 컬럼 매핑 (한글/영문 지원)
      const items = jsonData.map((row) => ({
        post_title: row['작성제목'] || row['제목'] || row['post_title'] || '',
        published_date: row['발행일'] || row['published_date'] || row['날짜'] || '',
        status: row['상태'] || row['status'] || '대기',
        post_url: row['리뷰링크'] || row['글링크'] || row['post_url'] || row['URL'] || '',
        writer_id: row['작성아이디'] || row['작성 아이디'] || row['writer_id'] || '',
        cafe_name: row['카페명'] || row['카페'] || row['cafe_name'] || '',
        notes: row['메모'] || row['notes'] || row['비고'] || '',
      }));

      // API 호출
      const response = await fetch(`/api/admin/cafe-marketing/${submissionId}/content-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '업로드 실패');
      }

      const result = await response.json();
      toast({
        title: '업로드 완료',
        description: result.message,
      });
      fetchContentItems();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: '업로드 오류',
        description: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // 파일 입력 초기화
      event.target.value = '';
    }
  };

  const handleDownloadExcel = () => {
    if (!submission) return;

    const getStatusLabel = (status: string | null) => {
      if (!status) return '대기';
      return contentStatusConfig[status]?.label || status;
    };

    const excelData = contentItems.map((item) => ({
      '접수번호': (submission as any).submission_number || '',
      '업체명': submission.company_name || '',
      '작성제목': item.post_title || '',
      '발행일': item.published_date || '',
      '상태': getStatusLabel(item.status),
      '리뷰링크': item.post_url || '',
      '작성아이디': item.writer_id || '',
      '카페명': item.cafe_name || '',
      '메모': item.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 18 },  // 접수번호
      { wch: 20 },  // 업체명
      { wch: 40 },  // 작성제목
      { wch: 12 },  // 발행일
      { wch: 10 },  // 상태
      { wch: 50 },  // 리뷰링크
      { wch: 20 },  // 작성아이디
      { wch: 20 },  // 카페명
      { wch: 30 },  // 메모
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '콘텐츠 목록');
    XLSX.writeFile(wb, `카페마케팅_${submission.company_name}_콘텐츠.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '접수번호': 'CM-2025-0001',
        '업체명': '예시업체',
        '작성제목': '예시 제목입니다',
        '발행일': '2025-01-01',
        '상태': '대기',
        '리뷰링크': 'https://cafe.naver.com/...',
        '작성아이디': 'writer123',
        '카페명': '강남맘카페',
        '메모': '',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 40 },
      { wch: 12 },
      { wch: 10 },
      { wch: 50 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '템플릿');
    XLSX.writeFile(wb, '카페마케팅_콘텐츠_템플릿.xlsx');
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/cafe-marketing/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('상태 변경 실패');

      toast({
        title: '성공',
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

  const totalCompletedCount = contentItems.length;
  const completionRate = submission ? Math.round((totalCompletedCount / submission.total_count) * 100) : 0;

  return {
    loading,
    submission,
    dailyRecords,
    contentItems,
    activeTab,
    uploading,
    totalCompletedCount,
    completionRate,

    setActiveTab,

    fetchSubmissionDetail,
    fetchDailyRecords,
    fetchContentItems,
    handleFileUpload,
    handleDownloadExcel,
    handleDownloadTemplate,
    handleStatusChange,
  };
}
