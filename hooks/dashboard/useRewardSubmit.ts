import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { format, addDays } from 'date-fns';
import type { RewardFormData } from '@/components/dashboard/reward-submit/types';
import { INITIAL_FORM_DATA, MIN_DAILY_VOLUME, MIN_OPERATION_DAYS, MAX_OPERATION_DAYS, REWARD_MEDIA_CONFIG } from '@/components/dashboard/reward-submit/constants';

export function useRewardSubmit(initialPoints: number) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState<RewardFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [activeProducts, setActiveProducts] = useState<string[]>([]);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [loadingBusinessName, setLoadingBusinessName] = useState(false);

  // 구동일수는 폼에서 직접 입력
  const operationDays = formData.operationDays;

  // 현재 선택된 매체의 pricingSlug 가져오기
  const selectedMediaConfig = REWARD_MEDIA_CONFIG.find(m => m.id === formData.mediaType);
  const currentPricingSlug = selectedMediaConfig?.pricingSlug || 'twoople-reward';

  // 현재 선택된 매체의 가격
  const currentPrice = pricing[currentPricingSlug] || 0;

  // 가격 설정 여부 확인 (현재 선택된 매체 기준)
  const isPriceConfigured = currentPrice > 0;

  // 활성화된 리워드 매체 필터링
  const activeMediaConfigs = REWARD_MEDIA_CONFIG.filter(m =>
    activeProducts.includes(m.pricingSlug)
  );

  // 활성화된 리워드 상품이 없는지 확인
  const noActiveProducts = !loadingPrice && activeMediaConfigs.length === 0;

  // 현재 선택된 매체가 비활성화되면 첫 번째 활성화된 매체로 전환
  useEffect(() => {
    if (loadingPrice || activeMediaConfigs.length === 0) return;

    const currentMediaConfig = activeMediaConfigs.find(m => m.id === formData.mediaType);
    if (!currentMediaConfig && activeMediaConfigs.length > 0) {
      setFormData(prev => ({ ...prev, mediaType: activeMediaConfigs[0].id }));
    }
  }, [loadingPrice, activeMediaConfigs, formData.mediaType]);

  // 가격 정보 불러오기
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();

        if (data.success && data.pricing) {
          // 리워드 관련 가격만 필터링 (twoople-reward, eureka-reward)
          const rewardPricingSlugs = REWARD_MEDIA_CONFIG.map(m => m.pricingSlug);
          const rewardPricing: Record<string, number> = {};

          for (const slug of rewardPricingSlugs) {
            if (data.pricing[slug]) {
              rewardPricing[slug] = data.pricing[slug];
            }
          }

          setPricing(rewardPricing);

          // 활성화된 상품 목록 저장
          if (data.activeProducts) {
            setActiveProducts(data.activeProducts);
          }
        }
      } catch (error) {
        console.error('가격 정보 로드 실패:', error);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPricingData();
  }, []);

  // 플레이스 링크에서 MID 자동 추출 및 업체명 가져오기
  const handlePlaceUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, placeUrl: url }));

    // MID 추출
    const mid = extractNaverPlaceMID(url);

    if (mid) {
      setFormData(prev => ({ ...prev, placeMid: mid }));

      // 업체명 자동 가져오기
      setLoadingBusinessName(true);
      try {
        const businessInfo = await fetchBusinessInfoByMID(mid);

        if (businessInfo && businessInfo.businessName) {
          setFormData(prev => ({ ...prev, businessName: businessInfo.businessName }));

          toast({
            title: '✅ 업체명 자동 입력 완료',
            description: `"${businessInfo.businessName}"이(가) 입력되었습니다.`,
            duration: 3000,
          });
        } else {
          toast({
            variant: 'destructive',
            title: '⚠️ 업체명 추출 실패',
            description: '업체명을 가져올 수 없습니다. 직접 입력해주세요.',
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('업체명 가져오기 실패:', error);
        toast({
          variant: 'destructive',
          title: '⚠️ 업체명 추출 오류',
          description: '업체명을 가져오는 중 오류가 발생했습니다. 직접 입력해주세요.',
          duration: 3000,
        });
      } finally {
        setLoadingBusinessName(false);
      }
    } else {
      setFormData(prev => ({ ...prev, placeMid: '' }));
    }
  };

  // 비용 계산 (선택된 매체의 가격 기준)
  const calculateTotalCost = () => {
    const totalCount = formData.dailyVolume * operationDays;
    return Math.round(totalCount * currentPrice);
  };

  // 시작일 선택 가능 최소 날짜 계산
  const getMinStartDate = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    // 주말 접수 판단: 금요일 18시 이후, 토요일, 일요일
    const isWeekendSubmission =
      dayOfWeek === 6 || // 토요일
      dayOfWeek === 0 || // 일요일
      (dayOfWeek === 5 && hour >= 18); // 금요일 18시 이후

    if (isWeekendSubmission) {
      // 다음 화요일 계산
      let daysUntilTuesday = 0;
      if (dayOfWeek === 5) { // 금요일 18시 이후 → 화요일까지 4일
        daysUntilTuesday = 4;
      } else if (dayOfWeek === 6) { // 토요일 → 화요일까지 3일
        daysUntilTuesday = 3;
      } else if (dayOfWeek === 0) { // 일요일 → 화요일까지 2일
        daysUntilTuesday = 2;
      }
      return addDays(today, daysUntilTuesday);
    }

    // 평일 접수 → 내일부터
    return addDays(today, 1);
  };

  const minStartDate = getMinStartDate();

  // 주말 접수 여부 확인
  const isWeekendSubmission = (() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    return dayOfWeek === 6 || dayOfWeek === 0 || (dayOfWeek === 5 && hour >= 18);
  })();

  const totalCost = calculateTotalCost();

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 선택된 매체의 가격이 설정되어 있는지 확인
    if (!isPriceConfigured) {
      const mediaName = selectedMediaConfig?.name || '선택된 매체';
      toast({
        variant: 'destructive',
        title: '⚠️ 가격 미설정',
        description: `${mediaName}의 가격이 설정되지 않았습니다. 관리자에게 문의하세요.`,
      });
      return;
    }

    if (!formData.businessName || !formData.placeUrl) {
      toast({
        variant: 'destructive',
        title: '⚠️ 필수 항목 누락',
        description: '업체명과 플레이스 링크를 입력해주세요.',
      });
      return;
    }

    if (!formData.placeMid) {
      toast({
        variant: 'destructive',
        title: '⚠️ MID 추출 실패',
        description: '플레이스 링크에서 MID를 추출할 수 없습니다. 올바른 링크를 입력해주세요.',
      });
      return;
    }

    if (formData.dailyVolume < MIN_DAILY_VOLUME) {
      toast({
        variant: 'destructive',
        title: '⚠️ 일 접수량 부족',
        description: `일 접수량은 최소 ${MIN_DAILY_VOLUME}타 이상이어야 합니다.`,
      });
      return;
    }

    if (!formData.startDate) {
      toast({
        variant: 'destructive',
        title: '⚠️ 날짜 선택 필요',
        description: '구동 시작일을 선택해주세요.',
      });
      return;
    }

    if (operationDays < MIN_OPERATION_DAYS || operationDays > MAX_OPERATION_DAYS) {
      toast({
        variant: 'destructive',
        title: '구동일수 오류',
        description: `구동일수는 ${MIN_OPERATION_DAYS}일 ~ ${MAX_OPERATION_DAYS}일 사이로 입력해주세요.`,
      });
      return;
    }

    if (totalCost > initialPoints) {
      toast({
        variant: 'destructive',
        title: '⚠️ 포인트 부족',
        description: `보유 포인트(${initialPoints.toLocaleString()}P)가 부족합니다.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submissions/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.businessName,
          place_url: formData.placeUrl,
          place_mid: formData.placeMid,
          daily_count: formData.dailyVolume,
          total_days: operationDays,
          total_points: totalCost,
          start_date: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : null,
          media_type: formData.mediaType, // 투플 또는 유레카
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '접수 중 오류가 발생했습니다.');
      }

      toast({
        title: '✅ 리워드 접수 완료',
        description: `${formData.businessName} - ${formData.dailyVolume}타/일 × ${operationDays}일 접수가 완료되었습니다.`,
        duration: 5000,
      });

      // 폼 초기화
      setFormData(INITIAL_FORM_DATA);

      // 1.5초 후 통합 접수 현황 페이지로 이동
      setTimeout(() => {
        router.push('/dashboard/submissions');
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error('접수 실패:', error);
      toast({
        variant: 'destructive',
        title: '❌ 접수 실패',
        description: error.message || '접수 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    pricing, // 매체별 가격 정보
    activeMediaConfigs, // 활성화된 매체 목록
    noActiveProducts, // 활성화된 리워드 상품 없음 여부
    loadingPrice,
    loadingBusinessName,
    operationDays,
    isPriceConfigured,
    minStartDate,
    isWeekendSubmission,
    totalCost,
    handlePlaceUrlChange,
    handleSubmit,
  };
}
