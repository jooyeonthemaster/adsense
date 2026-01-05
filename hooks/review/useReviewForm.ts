'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addDays, differenceInDays, format } from 'date-fns';
import { extractNaverPlaceMID, fetchBusinessInfoByMID } from '@/utils/naver-place';
import { extractKakaoPlaceMID, fetchKakaoBusinessInfoByMID } from '@/utils/kakao-place';
import type {
  ReviewType,
  VisitorFormData,
  KmapFormData,
  ReviewServiceConfig,
} from '@/types/review-marketing/types';
import {
  INITIAL_VISITOR_FORM,
  INITIAL_KMAP_FORM,
  createServices,
} from '@/components/dashboard/review-marketing/constants';

interface UseReviewFormReturn {
  // State
  selectedType: ReviewType;
  pricing: Record<string, number>;
  activeProducts: string[];
  loadingPrice: boolean;
  isSubmitting: boolean;
  loadingBusinessName: boolean;
  visitorFormData: VisitorFormData;
  kmapFormData: KmapFormData;
  services: ReviewServiceConfig[];
  currentService: ReviewServiceConfig | undefined;
  isPriceConfigured: boolean;
  noActiveProducts: boolean;

  // Computed values
  totalDays: number;
  totalCount: number;
  totalCost: number;
  minStartDate: Date;
  isWeekendSubmission: boolean;

  // Handlers
  setSelectedType: (type: ReviewType) => void;
  setVisitorFormData: React.Dispatch<React.SetStateAction<VisitorFormData>>;
  setKmapFormData: React.Dispatch<React.SetStateAction<KmapFormData>>;
  handleNaverPlaceUrlChange: (url: string) => Promise<void>;
  handleKmapUrlChange: (url: string) => Promise<void>;
  validateAndSubmit: (e: React.FormEvent) => Promise<boolean>;
  executeSubmit: () => Promise<void>;
}

export function useReviewForm(initialType: ReviewType): UseReviewFormReturn {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [selectedType, setSelectedType] = useState<ReviewType>(initialType);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [activeProducts, setActiveProducts] = useState<string[]>([]);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBusinessName, setLoadingBusinessName] = useState(false);
  const [visitorFormData, setVisitorFormData] = useState<VisitorFormData>(INITIAL_VISITOR_FORM);
  const [kmapFormData, setKmapFormData] = useState<KmapFormData>(INITIAL_KMAP_FORM);

  // 가격 정보 불러오기
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing');
        const data = await response.json();
        if (data.success) {
          if (data.pricing) {
            setPricing(data.pricing);
          }
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
    fetchPricing();
  }, []);

  // 서비스 목록 (activeProducts로 필터링)
  const allServices = createServices(pricing);
  const services = allServices.filter(service =>
    activeProducts.includes(service.priceKey)
  );
  const currentService = services.find((s) => s.id === selectedType);
  const isPriceConfigured = !!(currentService && currentService.pricePerUnit > 0);
  const noActiveProducts = !loadingPrice && services.length === 0;

  // 현재 폼 데이터에 따른 계산
  const startDate = selectedType === 'visitor' ? visitorFormData.startDate : kmapFormData.startDate;
  const endDate = selectedType === 'visitor' ? visitorFormData.endDate : kmapFormData.endDate;
  const dailyCount = selectedType === 'visitor' ? visitorFormData.dailyCount : kmapFormData.dailyCount;

  const totalDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const totalCount = dailyCount * totalDays;
  const totalCost = totalCount * (currentService?.pricePerUnit || 0);

  // 주말/금요일 18시 이후 접수 시 최소 시작일 계산
  const getMinStartDate = useCallback(() => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    const isWeekendSubmission =
      dayOfWeek === 6 || dayOfWeek === 0 || (dayOfWeek === 5 && hour >= 18);

    if (isWeekendSubmission) {
      let daysUntilTuesday = 0;
      if (dayOfWeek === 5) daysUntilTuesday = 4;
      else if (dayOfWeek === 6) daysUntilTuesday = 3;
      else if (dayOfWeek === 0) daysUntilTuesday = 2;
      return addDays(today, daysUntilTuesday);
    }

    return addDays(today, 1);
  }, []);

  const minStartDate = getMinStartDate();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const isWeekendSubmission = dayOfWeek === 6 || dayOfWeek === 0 || (dayOfWeek === 5 && hour >= 18);

  // 네이버 플레이스 URL 변경 핸들러
  const handleNaverPlaceUrlChange = useCallback(
    async (url: string) => {
      setVisitorFormData((prev) => ({ ...prev, placeUrl: url }));

      const mid = extractNaverPlaceMID(url);
      if (mid) {
        setVisitorFormData((prev) => ({ ...prev, placeMid: mid }));
        setLoadingBusinessName(true);
        try {
          const businessInfo = await fetchBusinessInfoByMID(mid);
          if (businessInfo?.businessName) {
            setVisitorFormData((prev) => ({ ...prev, businessName: businessInfo.businessName }));
            toast({
              title: '✅ 업체명 자동 입력 완료',
              description: `"${businessInfo.businessName}"이(가) 입력되었습니다.`,
              duration: 3000,
            });
          }
        } catch (error) {
          console.error('업체명 가져오기 실패:', error);
        } finally {
          setLoadingBusinessName(false);
        }
      } else {
        setVisitorFormData((prev) => ({ ...prev, placeMid: '' }));
      }
    },
    [toast]
  );

  // 카카오맵 URL 변경 핸들러
  const handleKmapUrlChange = useCallback(
    async (url: string) => {
      setKmapFormData((prev) => ({ ...prev, kmapUrl: url }));

      const mid = extractKakaoPlaceMID(url);
      if (!mid || kmapFormData.businessName.trim()) return;

      setLoadingBusinessName(true);
      try {
        const result = await fetchKakaoBusinessInfoByMID(mid);
        if (result?.businessName) {
          setKmapFormData((prev) => ({ ...prev, businessName: result.businessName }));
          toast({
            title: '업체명 자동 입력',
            description: `"${result.businessName}" 업체 정보를 불러왔습니다.`,
          });
        }
      } catch (error) {
        console.error('업체 정보 조회 실패:', error);
      } finally {
        setLoadingBusinessName(false);
      }
    },
    [kmapFormData.businessName, toast]
  );

  // 검증 및 제출 핸들러 (다이얼로그 표시 여부 반환)
  const validateAndSubmit = useCallback(
    async (e: React.FormEvent): Promise<boolean> => {
      e.preventDefault();

      if (selectedType === 'visitor') {
        // 네이버 영수증 검증
        if (!visitorFormData.businessName || !visitorFormData.placeUrl) {
          toast({ variant: 'destructive', title: '입력 오류', description: '필수 항목을 모두 입력해주세요.' });
          return false;
        }
        if (!visitorFormData.startDate || !visitorFormData.endDate) {
          toast({ variant: 'destructive', title: '입력 오류', description: '시작일과 종료일을 선택해주세요.' });
          return false;
        }
        if (totalDays < 3) {
          toast({ variant: 'destructive', title: '⚠️ 구동일수 부족', description: '구동일수는 3일 이상부터 접수가 가능합니다.' });
          return false;
        }
        if (totalCount < 30) {
          toast({ variant: 'destructive', title: '⚠️ 최소 주문건수 미달', description: `방문자 리뷰는 최소 30건 이상 주문하셔야 합니다. (현재: ${totalCount}건)` });
          return false;
        }
        if (!visitorFormData.placeMid) {
          toast({ variant: 'destructive', title: '입력 오류', description: '플레이스 링크에서 MID를 추출할 수 없습니다.' });
          return false;
        }
        if (visitorFormData.dailyCount < 1 || visitorFormData.dailyCount > 10) {
          toast({ variant: 'destructive', title: '입력 오류', description: '일 발행수량은 최소 1건, 최대 10건입니다.' });
          return false;
        }
        // 이메일 확인 다이얼로그 필요
        return true;
      } else {
        // 카카오맵 검증
        if (!kmapFormData.businessName || !kmapFormData.kmapUrl) {
          toast({ variant: 'destructive', title: '입력 오류', description: '필수 항목을 모두 입력해주세요.' });
          return false;
        }
        if (!kmapFormData.startDate || !kmapFormData.endDate) {
          toast({ variant: 'destructive', title: '입력 오류', description: '시작일과 종료일을 선택해주세요.' });
          return false;
        }
        if (kmapFormData.dailyCount < 1) {
          toast({ variant: 'destructive', title: '입력 오류', description: '일 발행수량은 최소 1건 이상이어야 합니다.' });
          return false;
        }
        if (totalCount < 10) {
          toast({ variant: 'destructive', title: '최소 주문건수 미달', description: 'K맵 리뷰는 최소 10건 이상 주문하셔야 합니다.' });
          return false;
        }
        // 바로 제출
        await executeSubmit();
        return false; // 다이얼로그 필요 없음
      }
    },
    [selectedType, visitorFormData, kmapFormData, totalDays, totalCount, toast]
  );

  // 실제 제출 실행
  const executeSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      let response;

      if (selectedType === 'visitor') {
        response = await fetch('/api/submissions/receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: visitorFormData.businessName,
            place_url: visitorFormData.placeUrl,
            daily_count: visitorFormData.dailyCount,
            total_days: totalDays,
            total_count: totalCount,
            total_points: totalCost,
            start_date: visitorFormData.startDate ? format(visitorFormData.startDate, 'yyyy-MM-dd') : null,
            photo_option: visitorFormData.photoOption,
            script_option: visitorFormData.scriptOption,
            notes: visitorFormData.guideline || null,
          }),
        });
      } else {
        response = await fetch('/api/submissions/kakaomap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: kmapFormData.businessName,
            kakaomap_url: kmapFormData.kmapUrl,
            daily_count: kmapFormData.dailyCount,
            total_count: totalCount,
            total_days: totalDays,
            total_points: totalCost,
            start_date: kmapFormData.startDate ? format(kmapFormData.startDate, 'yyyy-MM-dd') : null,
            script: kmapFormData.guideline || null,
            photo_urls: null,
            script_urls: null,
            text_review_count: kmapFormData.hasPhoto
              ? Math.floor(totalCount * (1 - kmapFormData.photoRatio / 100))
              : totalCount,
            photo_review_count: kmapFormData.hasPhoto
              ? Math.floor(totalCount * (kmapFormData.photoRatio / 100))
              : 0,
            photo_ratio: kmapFormData.photoRatio,
            star_rating: kmapFormData.starRating,
            script_type: kmapFormData.scriptOption,
            notes: kmapFormData.guideline || null,
          }),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '접수에 실패했습니다.');
      }

      const data = await response.json();

      toast({
        title: selectedType === 'visitor' ? '✅ 네이버 영수증 접수 완료!' : '✅ 카카오맵 접수 완료!',
        description: `차감 포인트: ${data.submission?.total_points?.toLocaleString() || '0'}P / 남은 포인트: ${data.new_balance?.toLocaleString() || '0'}P`,
        duration: 5000,
      });

      setTimeout(() => {
        router.push('/dashboard/submissions');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('접수 실패:', error);
      toast({
        variant: 'destructive',
        title: '접수 실패',
        description: error instanceof Error ? error.message : '접수 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedType, visitorFormData, kmapFormData, totalDays, totalCount, totalCost, toast, router]);

  return {
    selectedType,
    pricing,
    activeProducts,
    loadingPrice,
    isSubmitting,
    loadingBusinessName,
    visitorFormData,
    kmapFormData,
    services,
    currentService,
    isPriceConfigured,
    noActiveProducts,
    totalDays,
    totalCount,
    totalCost,
    minStartDate,
    isWeekendSubmission,
    setSelectedType,
    setVisitorFormData,
    setKmapFormData,
    handleNaverPlaceUrlChange,
    handleKmapUrlChange,
    validateAndSubmit,
    executeSubmit,
  };
}
