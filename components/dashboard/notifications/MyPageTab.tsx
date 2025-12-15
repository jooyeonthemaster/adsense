'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Building2,
  Mail,
  Phone,
  Loader2,
  ExternalLink,
  FileCheck,
  MessageCircle,
  Save,
  Megaphone,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { KAKAO_CHANNEL_URL } from './constants';
import type { ClientProfile, ProfileFormData } from './types';

interface MyPageTabProps {
  profile: ClientProfile | null;
  profileLoading: boolean;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  saving: boolean;
  uploading: boolean;
  saveProfile: () => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function MyPageTab({
  profile,
  profileLoading,
  formData,
  setFormData,
  saving,
  uploading,
  saveProfile,
  handleFileUpload,
}: MyPageTabProps) {
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">프로필 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* 기본 정보 */}
      <BasicInfoCard profile={profile} formData={formData} setFormData={setFormData} />

      {/* 사업자 정보 */}
      <BusinessInfoCard
        profile={profile}
        formData={formData}
        setFormData={setFormData}
        uploading={uploading}
        handleFileUpload={handleFileUpload}
      />

      {/* 저장 버튼 & 1:1 문의 */}
      <Card className="p-6 lg:col-span-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile?.profile_updated_at && (
              <p className="text-sm text-muted-foreground">
                마지막 수정:{' '}
                {format(new Date(profile.profile_updated_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* 1:1 문의 버튼 */}
            <Button
              variant="outline"
              onClick={() => window.open(KAKAO_CHANNEL_URL, '_blank')}
              className="flex-1 sm:flex-none"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              1:1 문의 (카카오톡)
            </Button>
            {/* 저장 버튼 */}
            <Button onClick={saveProfile} disabled={saving} className="flex-1 sm:flex-none">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              저장하기
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BasicInfoCard({
  profile,
  formData,
  setFormData,
}: {
  profile: ClientProfile | null;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">기본 정보</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label className="text-muted-foreground text-sm">아이디</Label>
          <Input value={profile?.username || ''} disabled className="bg-muted" />
        </div>

        <div className="grid gap-2">
          <Label className="text-muted-foreground text-sm">업체 유형</Label>
          <div className="flex items-center gap-2">
            {profile?.client_type === 'advertiser' ? (
              <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                <Building2 className="h-3 w-3 mr-1" />
                광고주
              </Badge>
            ) : profile?.client_type === 'agency' ? (
              <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                <Megaphone className="h-3 w-3 mr-1" />
                대행사
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">미설정</span>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="company_name">회사명</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="회사/상호명"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contact_person">담당자명</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="담당자 이름"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">연락처</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => {
                // 숫자만 추출
                const nums = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                // 010-0000-0000 형식으로 포맷팅
                let formatted = nums;
                if (nums.length > 3) {
                  formatted = nums.slice(0, 3) + '-' + nums.slice(3);
                }
                if (nums.length > 7) {
                  formatted = nums.slice(0, 3) + '-' + nums.slice(3, 7) + '-' + nums.slice(7);
                }
                setFormData({ ...formData, phone: formatted });
              }}
              placeholder="010-0000-0000"
              className="pl-10"
              maxLength={13}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function BusinessInfoCard({
  profile,
  formData,
  setFormData,
  uploading,
  handleFileUpload,
}: {
  profile: ClientProfile | null;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  uploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">사업자 정보</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="business_number">사업자등록번호</Label>
          <Input
            id="business_number"
            value={formData.business_number}
            onChange={(e) => {
              // 숫자만 추출
              const nums = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
              // 000-00-00000 형식으로 포맷팅
              let formatted = nums;
              if (nums.length > 3) {
                formatted = nums.slice(0, 3) + '-' + nums.slice(3);
              }
              if (nums.length > 5) {
                formatted = nums.slice(0, 3) + '-' + nums.slice(3, 5) + '-' + nums.slice(5);
              }
              setFormData({ ...formData, business_number: formatted });
            }}
            placeholder="000-00-00000"
            maxLength={12}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="representative_name">대표자명</Label>
          <Input
            id="representative_name"
            value={formData.representative_name}
            onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
            placeholder="대표자 이름"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="business_address">사업장 주소</Label>
          <Input
            id="business_address"
            value={formData.business_address}
            onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
            placeholder="사업장 주소"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tax_email">세금계산서 수령 이메일</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="tax_email"
              type="email"
              value={formData.tax_email}
              onChange={(e) => setFormData({ ...formData, tax_email: e.target.value })}
              placeholder="tax@example.com"
              className="pl-10"
            />
          </div>
        </div>

        {/* 사업자등록증 업로드 */}
        <div className="grid gap-2">
          <Label>사업자등록증</Label>
          {profile?.business_license_url ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 overflow-hidden">
              <FileCheck className="h-5 w-5 text-green-600 shrink-0" />
              <span className="text-sm text-green-700 flex-1 min-w-0 truncate">
                {profile.business_license_name || '업로드됨'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => window.open(profile.business_license_url!, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="flex-1"
            />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG, GIF, PDF (최대 5MB)</p>
        </div>
      </div>
    </Card>
  );
}
