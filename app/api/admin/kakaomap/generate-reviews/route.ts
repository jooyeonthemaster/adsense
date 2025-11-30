import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  generateReviewSpecs,
  generateReviewsBatch,
  ReviewSpec,
} from '@/lib/gemini';
import { getBusinessPrompt } from '@/lib/review-prompts';
import {
  AIReviewGenerateRequest,
  AIReviewGenerateResponse,
  LengthOption,
  ToneTarget,
  EmojiOption,
} from '@/types/review/ai-generation';

export const maxDuration = 300; // 5분 타임아웃 (대량 생성 시)

export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    await requireAuth(['admin']);

    const body: AIReviewGenerateRequest = await request.json();
    const {
      keyword,
      count,
      business_type,
      length_ratios,
      tone_ratios,
      emoji_ratios,
      custom_prompt,
      store_info,
    } = body;

    // 유효성 검사
    if (!keyword || !keyword.trim()) {
      return NextResponse.json(
        { success: false, error: '업체명/키워드를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!count || count < 1 || count > 500) {
      return NextResponse.json(
        { success: false, error: '생성 수량은 1~500개 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // 비율 합계 검증
    const validateRatioSum = (ratios: { percentage: number }[], name: string) => {
      const sum = ratios.reduce((acc, r) => acc + r.percentage, 0);
      if (Math.abs(sum - 100) > 1) {
        throw new Error(`${name} 비율의 합이 100%가 아닙니다. (현재: ${sum}%)`);
      }
    };

    try {
      validateRatioSum(length_ratios, '글자수');
      validateRatioSum(tone_ratios, '말투');
      validateRatioSum(emoji_ratios, '이모티콘');
    } catch (error) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 400 }
      );
    }

    // 프롬프트 가져오기
    const basePrompt = custom_prompt?.trim() || getBusinessPrompt(business_type);

    // 리뷰 스펙 생성 (어떤 조합으로 생성할지 결정)
    const specs: ReviewSpec[] = generateReviewSpecs(
      count,
      length_ratios,
      tone_ratios,
      emoji_ratios
    );

    // Gemini API로 리뷰 생성 (매장 정보 포함)
    const reviews = await generateReviewsBatch(
      keyword.trim(),
      basePrompt,
      specs,
      undefined, // onProgress
      store_info
    );

    // 통계 계산
    const stats = {
      total_requested: count,
      total_generated: reviews.length,
      by_length: {
        short: reviews.filter(r => r.length_type === 'short').length,
        medium: reviews.filter(r => r.length_type === 'medium').length,
        long: reviews.filter(r => r.length_type === 'long').length,
      } as Record<LengthOption, number>,
      by_tone: {
        '20s': reviews.filter(r => r.tone_type === '20s').length,
        '30s': reviews.filter(r => r.tone_type === '30s').length,
        '40s': reviews.filter(r => r.tone_type === '40s').length,
        '50s': reviews.filter(r => r.tone_type === '50s').length,
        'mz': reviews.filter(r => r.tone_type === 'mz').length,
      } as Record<ToneTarget, number>,
      by_emoji: {
        with: reviews.filter(r => r.has_emoji).length,
        without: reviews.filter(r => !r.has_emoji).length,
      } as Record<EmojiOption, number>,
    };

    const response: AIReviewGenerateResponse = {
      success: true,
      reviews,
      generation_stats: stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI 리뷰 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI 리뷰 생성 중 오류가 발생했습니다.',
        reviews: [],
        generation_stats: {
          total_requested: 0,
          total_generated: 0,
          by_length: { short: 0, medium: 0, long: 0 },
          by_tone: { '20s': 0, '30s': 0, '40s': 0, '50s': 0, 'mz': 0 },
          by_emoji: { with: 0, without: 0 },
        },
      } as AIReviewGenerateResponse,
      { status: 500 }
    );
  }
}

/**
 * 단일 리뷰 재생성 API
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const body = await request.json();
    const { keyword, business_type, length_type, tone_type, has_emoji, custom_prompt, store_info } = body;

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: '키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    const basePrompt = custom_prompt?.trim() || getBusinessPrompt(business_type);
    const spec: ReviewSpec = {
      length: length_type || 'medium',
      tone: tone_type || '30s',
      emoji: has_emoji ? 'with' : 'without',
    };

    const reviews = await generateReviewsBatch(keyword, basePrompt, [spec], undefined, store_info);

    if (reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: '리뷰 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review: reviews[0],
    });
  } catch (error) {
    console.error('단일 리뷰 재생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '리뷰 재생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
