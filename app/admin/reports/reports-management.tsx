'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

const SUBMISSION_TYPES = [
  { value: 'place', label: '플레이스 유입' },
  { value: 'receipt', label: '영수증 리뷰' },
  { value: 'kakaomap', label: '카카오맵 리뷰' },
  { value: 'blog', label: '블로그 배포' },
];

export function ReportsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [submissionType, setSubmissionType] = useState<string>('');
  const [submissionId, setSubmissionId] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('파일 크기는 50MB 이하여야 합니다.');
        return;
      }
      setReportFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!submissionType || !submissionId || !reportFile) {
        setError('모든 항목을 입력해주세요.');
        setLoading(false);
        return;
      }

      // Upload file to Supabase Storage
      const formData = new FormData();
      formData.append('file', reportFile);
      formData.append('folder', `reports/${submissionType}/${submissionId}`);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('파일 업로드에 실패했습니다.');
      }

      const uploadData = await uploadRes.json();

      // Create report record
      const reportRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          submission_type: submissionType,
          file_url: uploadData.url,
          file_name: reportFile.name,
        }),
      });

      const reportData = await reportRes.json();

      if (!reportRes.ok) {
        setError(reportData.error || '리포트 등록에 실패했습니다.');
        return;
      }

      // Success
      setSuccess('리포트가 성공적으로 업로드되었습니다.');
      setSubmissionId('');
      setReportFile(null);
      // Reset file input
      const fileInput = document.getElementById('report-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>리포트 업로드</CardTitle>
          <CardDescription>
            접수 건에 대한 작업 결과 리포트를 업로드합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="submission_type">
              상품 유형 <span className="text-destructive">*</span>
            </Label>
            <Select value={submissionType} onValueChange={setSubmissionType}>
              <SelectTrigger id="submission_type">
                <SelectValue placeholder="상품 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {SUBMISSION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="submission_id">
              접수 ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="submission_id"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              placeholder="접수 ID를 입력하세요"
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              접수 내역 페이지에서 해당 건의 ID를 확인하세요
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="report-file">
              리포트 파일 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="report-file"
              type="file"
              accept=".pdf,.xlsx,.xls,.doc,.docx,.zip"
              onChange={handleFileChange}
              disabled={loading}
            />
            {reportFile && (
              <p className="text-xs text-muted-foreground">
                선택된 파일: {reportFile.name} ({(reportFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              PDF, Excel, Word, ZIP 파일 (최대 50MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          {success}
        </div>
      )}

      <Button type="submit" disabled={loading} className="gap-2">
        <Upload className="h-4 w-4" />
        {loading ? '업로드 중...' : '리포트 업로드'}
      </Button>
    </form>
  );
}
