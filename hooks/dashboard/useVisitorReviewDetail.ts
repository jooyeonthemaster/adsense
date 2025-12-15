import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import type { ReceiptReviewDetail, DailyRecord, ContentItemExtended } from '@/components/dashboard/visitor-review-detail/types';

export function useVisitorReviewDetail(submissionId: string) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [submission, setSubmission] = useState<ReceiptReviewDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [activeTab, setActiveTab] = useState('content-list');
  const [contentItems, setContentItems] = useState<ContentItemExtended[]>([]);

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
    fetchContentItems();
  }, [submissionId]);

  const fetchContentItems = async () => {
    try {
      const response = await fetch(`/api/submissions/receipt/${submissionId}/content`);
      if (response.ok) {
        const data = await response.json();
        setContentItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/submissions/receipt/${submissionId}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubmission(data.submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast({
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyRecords = async () => {
    try {
      const response = await fetch(`/api/submissions/receipt/${submissionId}/daily-records`);
      if (response.ok) {
        const data = await response.json();
        setDailyRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching daily records:', error);
    }
  };

  const downloadAllFiles = async () => {
    if (!submission) return;

    const filesToDownload: string[] = [];

    if (submission.business_license_url) {
      filesToDownload.push(submission.business_license_url);
    }
    if (submission.photo_urls) {
      filesToDownload.push(...submission.photo_urls);
    }

    if (filesToDownload.length === 0) {
      toast({
        title: '알림',
        description: '다운로드할 파일이 없습니다.',
      });
      return;
    }

    try {
      setDownloadLoading(true);
      const zip = new JSZip();

      for (let i = 0; i < filesToDownload.length; i++) {
        const url = filesToDownload[i];
        const response = await fetch(url);
        const blob = await response.blob();

        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        let folderName = '';
        if (url === submission.business_license_url) {
          folderName = 'business_license/';
        } else if (submission.photo_urls?.includes(url)) {
          folderName = 'photos/';
        }

        zip.file(folderName + fileName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${submission.company_name}_${submissionId.slice(0, 8)}_files.zip`;
      saveAs(zipBlob, zipFileName);

      toast({
        title: '다운로드 완료',
        description: '파일이 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: '오류',
        description: '파일 다운로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const totalActualCount = dailyRecords.reduce((sum, record) => sum + record.actual_count, 0);
  const completionRate = submission ? Math.round((totalActualCount / submission.total_count) * 100) : 0;

  const contentProgressPercentage = submission?.total_count
    ? Math.min(Math.round((contentItems.length / submission.total_count) * 100), 100)
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { variant: 'default' as const, label: '승인됨' };
      case 'revision_requested':
        return { variant: 'secondary' as const, label: '수정요청' };
      default:
        return { variant: 'outline' as const, label: '대기' };
    }
  };

  const handleContentExcelDownload = () => {
    if (contentItems.length === 0) {
      toast({
        title: '알림',
        description: '다운로드할 데이터가 없습니다.',
      });
      return;
    }

    const excelData = contentItems.map((item, idx) => ({
      '순번': idx + 1,
      '리뷰원고': item.script_text || '',
      '리뷰등록날짜': item.review_registered_date || '',
      '영수증날짜': item.receipt_date || '',
      '상태': item.review_status === 'approved' ? '승인됨' : item.review_status === 'revision_requested' ? '수정요청' : '대기',
      '리뷰링크': item.review_link || '',
      '리뷰아이디': item.review_id || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '콘텐츠 목록');

    ws['!cols'] = [
      { wch: 6 },
      { wch: 50 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 30 },
      { wch: 15 },
    ];

    XLSX.writeFile(wb, `방문자리뷰_${submission?.company_name || 'report'}_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast({
      title: '다운로드 완료',
      description: '엑셀 파일이 다운로드되었습니다.',
    });
  };

  return {
    loading,
    downloadLoading,
    submission,
    dailyRecords,
    activeTab,
    contentItems,
    totalActualCount,
    completionRate,
    contentProgressPercentage,
    setActiveTab,
    downloadAllFiles,
    fetchDailyRecords,
    getStatusBadge,
    handleContentExcelDownload,
  };
}
