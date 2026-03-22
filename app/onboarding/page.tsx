'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  Building2,
  ArrowRight,
  Phone,
  Mail,
  User,
  Sparkles,
  Upload,
  UserPlus,
  MessageCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 카카오 채널 ID
const KAKAO_CHANNEL_ID = '_TdxoYn';
const KAKAO_CHANNEL_URL = `https://pf.kakao.com/${KAKAO_CHANNEL_ID}/friend`;

interface OnboardingData {
  contact_person: string;
  company_name: string;
  phone: string;
  email: string;
  tax_email: string;
  business_license_url: string | null;
  referrer_username: string;
}

const STEPS = [
  { id: 'welcome', title: '환영합니다' },
  { id: 'channel', title: '카카오 채널' },
  { id: 'info', title: '기본 정보' },
  { id: 'complete', title: '완료' },
];

// 캐릭터 대화 메시지
const CHARACTER_MESSAGES = {
  welcome: [
    '안녕하세요 👋',
    '마케팅자율무역협회',
    '마자무에 오신 걸 환영합니다.',
  ],
  channel: [
    '잠깐! 🔔',
    '서비스 이용을 위해',
    '카카오톡 채널 추가가 필요해요.',
  ],
  info: [
    '세금계산서 발행 및 원활한 서비스 이용을 위해 정보를 입력해 주세요.',
  ],
  complete: [
    '가입이 완료됐습니다.',
    '마자무를 통해 확실하고 간편하게 주문하세요 🙏',
  ],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [channelAdded, setChannelAdded] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    contact_person: '',
    company_name: '',
    phone: '',
    email: '',
    tax_email: '',
    business_license_url: null,
    referrer_username: '',
  });

  const [businessLicense, setBusinessLicense] = useState<File | null>(null);

  // 초기 로딩 - 이미 온보딩 완료했는지 확인
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/client/profile');
        if (!response.ok) {
          router.push('/login');
          return;
        }

        const profile = await response.json();

        // 이미 온보딩 완료한 경우 대시보드로
        if (profile.onboarding_completed) {
          router.push('/dashboard/notifications');
          return;
        }

        // 이미 채널 추가한 경우 체크
        if (profile.kakao_channel_added) {
          setChannelAdded(true);
        }

        // 기존 데이터로 폼 초기화 (관리자가 입력한 데이터 pre-fill)
        setFormData(prev => ({
          ...prev,
          contact_person: profile.contact_person || '',
          company_name: profile.company_name || '',
          phone: profile.phone || '',
          email: profile.email || '',
          tax_email: profile.tax_email || '',
          business_license_url: profile.business_license_url || null,
          referrer_username: '', // referrer_username은 ID만 있으므로 pre-fill 불가
        }));

        setLoading(false);
      } catch {
        router.push('/login');
      }
    };

    checkOnboardingStatus();
  }, [router]);

  // 메시지 순차 표시 효과
  useEffect(() => {
    if (loading) return;

    const stepKey = STEPS[currentStep].id as keyof typeof CHARACTER_MESSAGES;
    const messages = CHARACTER_MESSAGES[stepKey];

    setDisplayedMessages([]);
    setMessageIndex(0);
    setShowContent(false);

    const showNextMessage = (index: number) => {
      if (index < messages.length) {
        setTimeout(() => {
          setDisplayedMessages(prev => [...prev, messages[index]]);
          setMessageIndex(index + 1);
        }, index === 0 ? 300 : 800);
      } else {
        setTimeout(() => setShowContent(true), 500);
      }
    };

    showNextMessage(0);
  }, [currentStep, loading]);

  useEffect(() => {
    const stepKey = STEPS[currentStep].id as keyof typeof CHARACTER_MESSAGES;
    const messages = CHARACTER_MESSAGES[stepKey];

    if (messageIndex > 0 && messageIndex < messages.length) {
      const timer = setTimeout(() => {
        setDisplayedMessages(prev => [...prev, messages[messageIndex]]);
        setMessageIndex(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (messageIndex === messages.length) {
      const timer = setTimeout(() => setShowContent(true), 500);
      return () => clearTimeout(timer);
    }
  }, [messageIndex, currentStep]);

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    if (field === 'phone') {
      // 전화번호 포맷팅
      const nums = value.replace(/[^0-9]/g, '').slice(0, 11);
      let formatted = nums;
      if (nums.length > 3) {
        formatted = nums.slice(0, 3) + '-' + nums.slice(3);
      }
      if (nums.length > 7) {
        formatted = nums.slice(0, 3) + '-' + nums.slice(3, 7) + '-' + nums.slice(7);
      }
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // 카카오 채널 추가 버튼 클릭
  const handleAddChannel = () => {
    window.open(KAKAO_CHANNEL_URL, '_blank', 'noopener,noreferrer');
  };

  // 채널 추가 완료 확인
  const handleChannelAddedConfirm = async () => {
    setSubmitting(true);
    try {
      // 서버에 채널 추가 완료 저장
      const response = await fetch('/api/client/channel-added', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('채널 추가 상태 저장 실패');
      }

      setChannelAdded(true);
      setCurrentStep(2); // 다음 단계로
    } catch (error) {
      console.error('채널 추가 저장 에러:', error);
      alert('잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.contact_person.trim()) {
      return;
    }
    if (!formData.company_name.trim()) {
      return;
    }
    if (!formData.phone.trim()) {
      return;
    }
    if (!formData.email.trim()) {
      return;
    }
    if (!formData.tax_email.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      // 사업자등록증이 있으면 먼저 업로드
      let businessLicenseUrl: string | null = null;
      if (businessLicense) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', businessLicense);

        const uploadRes = await fetch('/api/client/upload-license', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json();
          throw new Error(uploadError.error || '파일 업로드에 실패했습니다.');
        }

        const uploadData = await uploadRes.json();
        businessLicenseUrl = uploadData.url;
      }

      // 온보딩 데이터 제출
      const response = await fetch('/api/client/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_person: formData.contact_person,
          company_name: formData.company_name,
          phone: formData.phone,
          email: formData.email,
          tax_email: formData.tax_email,
          business_license_url: businessLicenseUrl,
          referrer_username: formData.referrer_username || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '온보딩 저장 실패');
      }

      setCurrentStep(3); // 완료 단계로
    } catch (error) {
      console.error('온보딩 에러:', error);
      alert(error instanceof Error ? error.message : '온보딩 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard/notifications');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* 진행 표시 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              index === currentStep ? 'w-8 bg-primary' : 'w-2',
              index < currentStep ? 'bg-primary' : 'bg-primary/20'
            )}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* 캐릭터 영역 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-6"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="마자무"
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* 말풍선 메시지 */}
        <div className="space-y-3 mb-6 min-h-[100px]">
          <AnimatePresence mode="popLayout">
            {displayedMessages.map((message, index) => (
              <motion.div
                key={`${currentStep}-${index}`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <span className="inline-block bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-sm text-gray-700 whitespace-pre-line">
                  {message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 메인 컨텐츠 */}
        <AnimatePresence mode="wait">
          {showContent && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={() => setCurrentStep(1)}
                    className="gradient-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105 px-8"
                  >
                    시작하기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Step 1: Kakao Channel Add */}
              {currentStep === 1 && (
                <Card className="shadow-xl">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center space-y-4">
                      {/* 카카오 아이콘 */}
                      <div className="flex justify-center">
                        <div className="w-20 h-20 bg-[#FEE500] rounded-full flex items-center justify-center">
                          <MessageCircle className="h-10 w-10 text-[#3C1E1E]" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          카카오톡 채널 친구 추가
                        </h3>
                        <p className="text-sm text-gray-600">
                          서비스 이용 안내 및 주문 알림을<br />
                          카카오톡으로 받아보실 수 있습니다
                        </p>
                      </div>

                      {/* 채널 추가 버튼 */}
                      <Button
                        onClick={handleAddChannel}
                        className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium transition-all duration-300 hover:shadow-lg text-base"
                      >
                        <svg
                          className="mr-2 h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.5 6.54-.2.72-.72 2.64-.84 3.06-.12.54.2.54.42.42.18-.06 2.82-1.92 3.96-2.7.6.06 1.26.12 1.92.12 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
                        </svg>
                        채널 추가하기
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>

                      <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500 mb-3">
                          채널을 추가하셨나요?
                        </p>
                        <Button
                          onClick={handleChannelAddedConfirm}
                          disabled={submitting}
                          variant="outline"
                          className="w-full h-11 border-primary text-primary hover:bg-primary hover:text-white transition-all"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              확인 중...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              채널 추가 완료했습니다
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Basic Info */}
              {currentStep === 2 && (
                <Card className="shadow-xl">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contact_person" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        담당자명 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                        placeholder="담당자 이름을 입력해주세요"
                        className="h-11"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="company_name" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        회사명 / 상호명 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        placeholder="회사명 또는 상호명을 입력해주세요"
                        className="h-11"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        연락처 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="010-0000-0000"
                        className="h-11"
                        maxLength={13}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        이메일 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="example@company.com"
                        className="h-11"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="tax_email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        세금계산서 이메일 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="tax_email"
                        type="email"
                        value={formData.tax_email}
                        onChange={(e) => handleInputChange('tax_email', e.target.value)}
                        placeholder="tax@company.com"
                        className="h-11"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="business_license" className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-primary" />
                        사업자등록증 <span className="text-xs text-gray-400 font-normal">(선택)</span>
                      </Label>
                      <Input
                        id="business_license"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setBusinessLicense(e.target.files?.[0] || null)}
                        className="h-11 cursor-pointer"
                      />
                      {businessLicense && (
                        <p className="text-xs text-muted-foreground">
                          선택된 파일: {businessLicense.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        로그인 후 마이페이지에서도 등록할 수 있습니다.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="referrer_username" className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        추천인 ID (선택)
                      </Label>
                      <Input
                        id="referrer_username"
                        value={formData.referrer_username}
                        onChange={(e) => handleInputChange('referrer_username', e.target.value)}
                        placeholder="추천인의 사용자명"
                        className="h-11"
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !formData.contact_person || !formData.company_name || !formData.phone || !formData.email || !formData.tax_email}
                      className="w-full h-12 gradient-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 text-base"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          완료하기
                          <Sparkles className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Complete */}
              {currentStep === 3 && (
                <div className="text-center space-y-6">
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    className="gradient-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105 px-8"
                  >
                    서비스 시작하기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
