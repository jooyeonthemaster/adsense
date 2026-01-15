import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { KakaomapReviewDetail, DailyRecord } from '@/components/admin/kakaomap-detail/types';
import type { ContentItem } from '@/components/admin/kakaomap/ContentItemsList';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export function useKakaomapDetail(submissionId: string) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [submission, setSubmission] = useState<KakaomapReviewDetail | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);

  useEffect(() => {
    fetchSubmissionDetail();
    fetchDailyRecords();
    fetchContentItems();
    fetchUnreadFeedbackCount();
  }, [submissionId]);

  const fetchSubmissionDetail = async () => {
    try {
      const response = await fetch(`/api/admin/kakaomap/${submissionId}`);
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
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/daily-records`);
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
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/content`);
      if (response.ok) {
        const data = await response.json();
        setContentItems(data.content_items || []);
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
    }
  };

  const fetchUnreadFeedbackCount = async () => {
    try {
      const response = await fetch(`/api/submissions/kakaomap/${submissionId}/feedback/unread-count`);
      if (response.ok) {
        const data = await response.json();
        setUnreadFeedbackCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread feedback count:', error);
    }
  };

  const markFeedbacksAsRead = async () => {
    try {
      const response = await fetch(`/api/submissions/kakaomap/${submissionId}/feedback/mark-read`, {
        method: 'POST',
      });
      if (response.ok) {
        setUnreadFeedbackCount(0);
      }
    } catch (error) {
      console.error('Error marking feedbacks as read:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: '상태 변경 완료',
        description: '접수 상태가 변경되었습니다.',
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

  const handlePublish = async () => {
    if (!submission) return;

    try {
      // 사진 비율 체크 없이 바로 검수 요청
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/publish?force=true`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '검수 요청에 실패했습니다.');
      }

      toast({
        title: '✓ 검수 요청 완료',
        description: `${result.published_count}개의 원고가 대행사에 검수 요청되었습니다.`,
      });

      // 새로고침
      fetchSubmissionDetail();
      fetchContentItems();
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '검수 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 엑셀 다운로드 (업로드 템플릿과 동일한 형식)
  const downloadContentItemsAsExcel = () => {
    if (!submission || contentItems.length === 0) {
      toast({
        title: '알림',
        description: '다운로드할 콘텐츠가 없습니다.',
      });
      return;
    }

    // 업로드 템플릿과 동일한 형식: 접수번호, 업체명, 리뷰원고, 리뷰등록날짜, 영수증날짜, 상태, 리뷰링크, 리뷰아이디
    const excelData = contentItems.map((item) => ({
      '접수번호': submission.submission_number || '',
      '업체명': submission.company_name || '',
      '리뷰원고': item.script_text || '',
      '리뷰등록날짜': item.review_registered_date || '',
      '영수증날짜': item.receipt_date || '',
      '상태': item.status === 'approved' ? '승인됨' : item.status === 'rejected' ? '수정요청' : '대기',
      '리뷰링크': item.review_link || '',
      '리뷰아이디': item.review_id || '',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정 (업로드 템플릿과 동일)
    ws['!cols'] = [
      { wch: 18 },  // 접수번호
      { wch: 20 },  // 업체명
      { wch: 60 },  // 리뷰원고
      { wch: 14 },  // 리뷰등록날짜
      { wch: 14 },  // 영수증날짜
      { wch: 10 },  // 상태
      { wch: 45 },  // 리뷰링크
      { wch: 18 },  // 리뷰아이디
    ];

    const wb = XLSX.utils.book_new();
    // 시트명을 업로드 템플릿과 동일하게 'K맵리뷰'로 설정
    XLSX.utils.book_append_sheet(wb, ws, 'K맵리뷰');

    const fileName = `K맵리뷰_${submission.company_name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: '다운로드 완료',
      description: `${contentItems.length}건의 콘텐츠가 다운로드되었습니다.`,
    });
  };

  const totalActualCount = dailyRecords.reduce((sum, record) => sum + record.actual_count, 0);
  const completionRate = submission ? Math.round((totalActualCount / submission.total_count) * 100) : 0;

  return {
    loading,
    downloadLoading,
    submission,
    dailyRecords,
    contentItems,
    activeTab,
    totalActualCount,
    completionRate,
    unreadFeedbackCount,

    setActiveTab,

    fetchSubmissionDetail,
    fetchDailyRecords,
    fetchContentItems,
    handleStatusChange,
    downloadAllFiles,
    handlePublish,
    downloadContentItemsAsExcel,
    markFeedbacksAsRead,
  };
}
