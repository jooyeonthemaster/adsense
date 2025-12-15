import { useState, useEffect } from 'react';
import type { DetailData } from '@/components/admin/submission-detail/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function useSubmissionDetail(
  open: boolean,
  submissionId: string,
  submissionType: 'place' | 'receipt' | 'kakaomap' | 'blog' | 'cafe' | 'experience'
) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && submissionId) {
      fetchDetail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submissionId, submissionType]);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/submissions/${submissionId}?type=${submissionType}`
      );
      if (!response.ok) {
        throw new Error('상세 정보를 불러오는데 실패했습니다.');
      }
      const result = await response.json();
      setData(result.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadAllFiles = async () => {
    if (!data) return;

    const filesToDownload: string[] = [];

    // 영수증 리뷰의 파일들 수집
    if (submissionType === 'receipt') {
      if (data.business_license_url) {
        filesToDownload.push(data.business_license_url);
      }
      if (data.photo_urls) {
        filesToDownload.push(...data.photo_urls);
      }
    }

    // 카카오맵의 파일들 수집
    if (submissionType === 'kakaomap') {
      if (data.photo_urls) {
        filesToDownload.push(...data.photo_urls);
      }
      if (data.script_urls) {
        filesToDownload.push(...data.script_urls);
      }
    }

    if (filesToDownload.length === 0) {
      alert('다운로드할 파일이 없습니다.');
      return;
    }

    try {
      setLoading(true);
      const zip = new JSZip();

      // 모든 파일 다운로드 및 ZIP에 추가
      for (let i = 0; i < filesToDownload.length; i++) {
        const url = filesToDownload[i];
        const response = await fetch(url);
        const blob = await response.blob();

        // 파일명 추출 (URL에서 마지막 부분)
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        // 파일 타입에 따라 폴더 구분
        let folderName = '';
        if (url === data.business_license_url) {
          folderName = 'business_license/';
        } else if (data.photo_urls?.includes(url)) {
          folderName = 'photos/';
        } else if (data.script_urls?.includes(url)) {
          folderName = 'scripts/';
        }

        zip.file(folderName + fileName, blob);
      }

      // ZIP 파일 생성 및 다운로드
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${data.company_name}_${submissionId.slice(0, 8)}_files.zip`;
      saveAs(zipBlob, zipFileName);

    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    data,
    loading,
    error,
    imagePreview,
    setImagePreview,
    copyToClipboard,
    downloadAllFiles,
    formatDate,
  };
}
