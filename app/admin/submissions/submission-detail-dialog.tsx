'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, ExternalLink, Download, FileText, Image as ImageIcon, X, Package } from 'lucide-react';
import { SubmissionStatus } from '@/types/submission';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  submissionType: 'place' | 'receipt' | 'kakaomap' | 'blog' | 'cafe';
}

interface DetailData {
  id: string;
  client_id: string;
  company_name: string;
  total_points: number;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  notes?: string;
  clients?: {
    id: string;
    username: string;
    company_name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  };
  // Place specific
  place_url?: string;
  daily_count?: number;
  total_days?: number;
  start_date?: string;
  // Receipt specific
  total_count?: number;
  business_license_url?: string;
  photo_urls?: string[];
  has_photo?: boolean;
  has_script?: boolean;
  // Kakaomap specific
  kakaomap_url?: string;
  text_review_count?: number;
  photo_review_count?: number;
  script_urls?: string[];
  script_confirmed?: boolean;
  // Blog specific
  distribution_type?: string;
  content_type?: string;
  keywords?: string[];
  // Cafe specific
  region?: string;
  cafe_details?: Array<{ name: string; count: number }>;
  script_status?: string;
  script_url?: string;
  guideline?: string;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: '대기중',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_VARIANTS: Record<
  SubmissionStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'outline',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
};

const TYPE_LABELS: Record<string, string> = {
  place: '플레이스 유입',
  receipt: '영수증 리뷰',
  kakaomap: '카카오맵 리뷰',
  blog: '블로그 배포',
  cafe: '카페 침투',
};

export function SubmissionDetailDialog({
  open,
  onOpenChange,
  submissionId,
  submissionType,
}: SubmissionDetailDialogProps) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && submissionId) {
      fetchDetail();
    }
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
    // Could add a toast notification here
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
      // script_urls가 있다면 추가
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

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>접수 상세 정보</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>접수 상세 정보</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-destructive">
            {error || '데이터를 불러올 수 없습니다.'}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              접수 상세 정보
              <Badge variant="outline">{TYPE_LABELS[submissionType]}</Badge>
              <Badge variant={STATUS_VARIANTS[data.status]}>
                {STATUS_LABELS[data.status]}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              접수 ID: {submissionId.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 거래처 정보 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">거래처 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">거래처명</div>
                  <div className="font-medium">{data.clients?.company_name || '-'}</div>

                  <div className="text-muted-foreground">아이디</div>
                  <div className="font-mono text-xs">{data.clients?.username || '-'}</div>

                  {data.clients?.contact_person && (
                    <>
                      <div className="text-muted-foreground">담당자</div>
                      <div>{data.clients.contact_person}</div>
                    </>
                  )}

                  {data.clients?.phone && (
                    <>
                      <div className="text-muted-foreground">연락처</div>
                      <div>{data.clients.phone}</div>
                    </>
                  )}

                  {data.clients?.email && (
                    <>
                      <div className="text-muted-foreground">이메일</div>
                      <div className="text-xs">{data.clients.email}</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 접수 기본 정보 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">접수 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground">업체명</div>
                  <div className="font-medium">{data.company_name}</div>

                  <div className="text-muted-foreground">사용 포인트</div>
                  <div className="font-bold text-primary">
                    {data.total_points.toLocaleString()} P
                  </div>

                  <div className="text-muted-foreground">접수일시</div>
                  <div className="font-mono text-xs">{formatDate(data.created_at)}</div>

                  <div className="text-muted-foreground">수정일시</div>
                  <div className="font-mono text-xs">{formatDate(data.updated_at)}</div>

                  {data.start_date && (
                    <>
                      <div className="text-muted-foreground">시작일</div>
                      <div>{data.start_date}</div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 상품별 상세 정보 */}
            {submissionType === 'place' && data.place_url && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">플레이스 유입 상세</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">일 접수량</div>
                    <div className="font-medium">{data.daily_count}타</div>

                    <div className="text-muted-foreground">구동일수</div>
                    <div className="font-medium">{data.total_days}일</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-muted-foreground mb-1">플레이스 URL</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-2 py-1 bg-muted rounded text-xs break-all">
                        {data.place_url}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(data.place_url!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(data.place_url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {submissionType === 'receipt' && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">영수증 리뷰 상세</CardTitle>
                    {(data.business_license_url || (data.photo_urls && data.photo_urls.length > 0)) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={downloadAllFiles}
                        disabled={loading}
                      >
                        <Package className="h-3 w-3 mr-1" />
                        {loading ? '다운로드 중...' : '일괄 다운로드'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">총 타수</div>
                    <div className="font-medium">{data.total_count}타</div>

                    <div className="text-muted-foreground">사진 첨부</div>
                    <div>{data.has_photo ? '있음' : '없음'}</div>
                  </div>

                  {data.place_url && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-muted-foreground mb-1">네이버 플레이스 URL</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-muted rounded text-xs break-all">
                            {data.place_url}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(data.place_url!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(data.place_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {data.business_license_url && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-muted-foreground mb-1">사업자등록증</div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setImagePreview(data.business_license_url!)}
                          >
                            <ImageIcon className="h-3 w-3 mr-1" />
                            미리보기
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(data.business_license_url, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            다운로드
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {data.photo_urls && data.photo_urls.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-muted-foreground mb-2">
                          업로드 사진 ({data.photo_urls.length}장)
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {data.photo_urls.map((url, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              className="h-auto flex-col py-2"
                              onClick={() => setImagePreview(url)}
                            >
                              <ImageIcon className="h-4 w-4 mb-1" />
                              <span className="text-xs">사진 {index + 1}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {submissionType === 'kakaomap' && data.kakaomap_url && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">카카오맵 리뷰 상세</CardTitle>
                    {(data.photo_urls && data.photo_urls.length > 0) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={downloadAllFiles}
                        disabled={loading}
                      >
                        <Package className="h-3 w-3 mr-1" />
                        {loading ? '다운로드 중...' : '일괄 다운로드'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">총 타수</div>
                    <div className="font-medium">{data.total_count}타</div>

                    <div className="text-muted-foreground">텍스트 리뷰</div>
                    <div>{data.text_review_count || 0}개</div>

                    <div className="text-muted-foreground">사진 리뷰</div>
                    <div>{data.photo_review_count || 0}개</div>

                    <div className="text-muted-foreground">스크립트 확인</div>
                    <div>{data.script_confirmed ? '확인함' : '미확인'}</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-muted-foreground mb-1">카카오맵 URL</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-2 py-1 bg-muted rounded text-xs break-all">
                        {data.kakaomap_url}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(data.kakaomap_url!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(data.kakaomap_url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {submissionType === 'blog' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">블로그 배포 상세</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">배포 타입</div>
                    <div className="font-medium">
                      {data.distribution_type === 'reviewer'
                        ? '리뷰어형'
                        : data.distribution_type === 'video'
                        ? '영상형'
                        : '자동화형'}
                    </div>

                    <div className="text-muted-foreground">콘텐츠 타입</div>
                    <div>{data.content_type === 'review' ? '리뷰' : '정보'}</div>

                    <div className="text-muted-foreground">일 타수</div>
                    <div className="font-medium">{data.daily_count}타</div>

                    <div className="text-muted-foreground">총 타수</div>
                    <div className="font-medium">{data.total_count}타</div>
                  </div>

                  {data.keywords && data.keywords.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-muted-foreground mb-2">키워드</div>
                        <div className="flex flex-wrap gap-1">
                          {data.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {data.place_url && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-muted-foreground mb-1">플레이스 URL</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 bg-muted rounded text-xs break-all">
                            {data.place_url}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(data.place_url!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(data.place_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 비고 */}
            {data.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">비고</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 이미지 미리보기 모달 */}
      {imagePreview && (
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                이미지 미리보기
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setImagePreview(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(imagePreview, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
