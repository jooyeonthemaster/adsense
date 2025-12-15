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
  Megaphone,
  ArrowRight,
  Phone,
  Mail,
  User,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ClientType = 'advertiser' | 'agency';

interface OnboardingData {
  client_type: ClientType | null;
  company_name: string;
  representative_name: string;
  contact_person: string;
  phone: string;
  email: string;
}

const STEPS = [
  { id: 'welcome', title: '환영합니다' },
  { id: 'type', title: '유형 선택' },
  { id: 'info', title: '기본 정보' },
  { id: 'complete', title: '완료' },
];

// 캐릭터 대화 메시지
const CHARACTER_MESSAGES = {
  welcome: [
    '안녕하세요! 반가워요 👋',
    '저는 마자무예요!',
    '앞으로 마케팅 여정을 함께할 친구가 되어드릴게요.',
  ],
  type: [
    '먼저 간단한 질문이 있어요!',
    '어떤 분이신지 알려주시면\n맞춤 서비스를 제공해 드릴 수 있어요.',
  ],
  info: [
    '좋아요! 거의 다 왔어요 ✨',
    '원활한 서비스 이용을 위해\n몇 가지 정보만 입력해 주세요.',
  ],
  complete: [
    '축하해요! 모든 준비가 끝났어요 🎉',
    '이제 마자무의 다양한 마케팅 서비스를\n마음껏 이용해 보세요!',
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

  const [formData, setFormData] = useState<OnboardingData>({
    client_type: null,
    company_name: '',
    representative_name: '',
    contact_person: '',
    phone: '',
    email: '',
  });

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

        // 기존 데이터로 폼 초기화
        setFormData(prev => ({
          ...prev,
          company_name: profile.company_name || '',
          email: profile.email || '',
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

  const handleTypeSelect = (type: ClientType) => {
    setFormData(prev => ({ ...prev, client_type: type }));
    setCurrentStep(2);
  };

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

  const handleSubmit = async () => {
    // 유효성 검사
    if (!formData.company_name.trim()) {
      return;
    }
    if (!formData.representative_name.trim()) {
      return;
    }
    if (!formData.phone.trim()) {
      return;
    }
    if (!formData.email.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/client/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('온보딩 저장 실패');
      }

      setCurrentStep(3);
    } catch (error) {
      console.error('온보딩 에러:', error);
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

              {/* Step 1: Type Selection */}
              {currentStep === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2',
                      formData.client_type === 'advertiser'
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-primary/30'
                    )}
                    onClick={() => handleTypeSelect('advertiser')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">광고주</h3>
                      <p className="text-sm text-muted-foreground">
                        직접 마케팅을<br />진행하시는 분
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      'cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2',
                      formData.client_type === 'agency'
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-primary/30'
                    )}
                    onClick={() => handleTypeSelect('agency')}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">대행사</h3>
                      <p className="text-sm text-muted-foreground">
                        고객사 대신<br />마케팅을 대행하시는 분
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 2: Basic Info */}
              {currentStep === 2 && (
                <Card className="shadow-xl">
                  <CardContent className="p-6 space-y-4">
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
                      <Label htmlFor="representative_name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        대표자명 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="representative_name"
                        value={formData.representative_name}
                        onChange={(e) => handleInputChange('representative_name', e.target.value)}
                        placeholder="대표자 이름을 입력해주세요"
                        className="h-11"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="contact_person" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        담당자명 (선택)
                      </Label>
                      <Input
                        id="contact_person"
                        value={formData.contact_person}
                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                        placeholder="담당자 이름 (대표자와 다른 경우)"
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

                    <p className="text-xs text-muted-foreground text-center pt-2">
                      * 사업자등록증은 나중에 마이페이지에서 업로드할 수 있어요
                    </p>

                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !formData.company_name || !formData.representative_name || !formData.phone || !formData.email}
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
