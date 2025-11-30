/**
 * Gemini AI API 클라이언트
 * 모델: gemini-2.5-flash
 */

import {
  GeneratedReview,
  LengthOption,
  ToneTarget,
  EmojiOption,
  LENGTH_OPTIONS,
  StoreInfo,
} from '@/types/review/ai-generation';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Gemini API 호출
 */
export async function callGeminiAPI(prompt: string, options?: {
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }

  const request: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options?.temperature ?? 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: options?.maxOutputTokens ?? 8192,
      responseMimeType: 'application/json',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', errorText);
    throw new Error(`Gemini API 호출 실패: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API 응답이 비어있습니다.');
  }

  const text = data.candidates[0].content.parts[0].text;
  return text;
}

/**
 * 비율에 따라 각 옵션별 개수 계산
 */
export function calculateDistribution<T extends string>(
  totalCount: number,
  ratios: { value: T; percentage: number }[]
): Map<T, number> {
  const distribution = new Map<T, number>();
  let remaining = totalCount;

  // 비율이 높은 순으로 정렬
  const sortedRatios = [...ratios].sort((a, b) => b.percentage - a.percentage);

  sortedRatios.forEach((ratio, index) => {
    if (index === sortedRatios.length - 1) {
      // 마지막 항목은 나머지 모두 할당 (반올림 오차 처리)
      distribution.set(ratio.value, remaining);
    } else {
      const count = Math.round(totalCount * (ratio.percentage / 100));
      distribution.set(ratio.value, count);
      remaining -= count;
    }
  });

  return distribution;
}

/**
 * 리뷰 생성을 위한 조합 생성
 */
export interface ReviewSpec {
  length: LengthOption;
  tone: ToneTarget;
  emoji: EmojiOption;
}

export function generateReviewSpecs(
  totalCount: number,
  lengthRatios: { value: string; percentage: number }[],
  toneRatios: { value: string; percentage: number }[],
  emojiRatios: { value: string; percentage: number }[]
): ReviewSpec[] {
  const lengthDist = calculateDistribution(totalCount, lengthRatios as { value: LengthOption; percentage: number }[]);
  const toneDist = calculateDistribution(totalCount, toneRatios as { value: ToneTarget; percentage: number }[]);
  const emojiDist = calculateDistribution(totalCount, emojiRatios as { value: EmojiOption; percentage: number }[]);

  const specs: ReviewSpec[] = [];

  // 각 조합을 만들어서 배열에 추가
  const lengths = Array.from(lengthDist.entries()).flatMap(([length, count]) =>
    Array(count).fill(length)
  );
  const tones = Array.from(toneDist.entries()).flatMap(([tone, count]) =>
    Array(count).fill(tone)
  );
  const emojis = Array.from(emojiDist.entries()).flatMap(([emoji, count]) =>
    Array(count).fill(emoji)
  );

  // 셔플하여 다양한 조합 생성
  shuffleArray(lengths);
  shuffleArray(tones);
  shuffleArray(emojis);

  for (let i = 0; i < totalCount; i++) {
    specs.push({
      length: lengths[i % lengths.length],
      tone: tones[i % tones.length],
      emoji: emojis[i % emojis.length],
    });
  }

  return specs;
}

/**
 * Fisher-Yates 셔플 알고리즘
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * 매장 정보를 프롬프트 텍스트로 변환
 */
export function buildStoreInfoSection(storeInfo?: StoreInfo): string {
  if (!storeInfo) return '';

  const sections: string[] = [];

  if (storeInfo.menu_items?.trim()) {
    sections.push(`[대표 메뉴/서비스]\n${storeInfo.menu_items.trim()}`);
  }

  if (storeInfo.price_range?.trim()) {
    sections.push(`[가격대]: ${storeInfo.price_range.trim()}`);
  }

  if (storeInfo.atmosphere?.trim()) {
    sections.push(`[분위기/컨셉]: ${storeInfo.atmosphere.trim()}`);
  }

  if (storeInfo.highlights?.trim()) {
    sections.push(`[특장점]\n${storeInfo.highlights.trim()}`);
  }

  if (storeInfo.must_include_keywords?.trim()) {
    const keywords = storeInfo.must_include_keywords.split(',').map(k => k.trim()).filter(Boolean);
    if (keywords.length > 0) {
      sections.push(`[반드시 포함할 키워드]: ${keywords.join(', ')}`);
    }
  }

  if (storeInfo.avoid_keywords?.trim()) {
    const keywords = storeInfo.avoid_keywords.split(',').map(k => k.trim()).filter(Boolean);
    if (keywords.length > 0) {
      sections.push(`[피해야 할 키워드/표현]: ${keywords.join(', ')}`);
    }
  }

  if (storeInfo.additional_info?.trim()) {
    sections.push(`[기타 참고 정보]\n${storeInfo.additional_info.trim()}`);
  }

  if (sections.length === 0) return '';

  return `\n\n=== 매장 상세 정보 ===\n${sections.join('\n\n')}\n\n위 매장 정보를 참고하여 구체적이고 사실적인 리뷰를 작성하세요. 메뉴명, 가격, 특징 등을 자연스럽게 언급하면 더욱 진정성 있는 리뷰가 됩니다.`;
}

/**
 * 단일 리뷰 생성 프롬프트
 */
export function buildSingleReviewPrompt(
  keyword: string,
  businessPrompt: string,
  spec: ReviewSpec,
  storeInfo?: StoreInfo
): string {
  const lengthInfo = LENGTH_OPTIONS[spec.length];

  const toneDescriptions: Record<ToneTarget, string> = {
    '20s': '20대 말투: 친근하고 캐주얼한 말투를 사용하세요. "~했어요", "~인 것 같아요", "진짜", "완전", "대박" 등의 표현과 가벼운 신조어를 적절히 사용합니다.',
    '30s': '30대 말투: 자연스럽고 균형 잡힌 말투를 사용하세요. 너무 격식있지도, 너무 캐주얼하지도 않은 중립적인 톤으로 작성합니다.',
    '40s': '40대 말투: 차분하고 신뢰감 있는 말투를 사용하세요. 구체적인 정보와 경험을 바탕으로 객관적인 평가를 담습니다.',
    '50s': '50대 말투: 정중하고 격식 있는 말투를 사용하세요. "~습니다", "~였습니다" 체를 주로 사용하고 차분한 어조로 작성합니다.',
    'mz': 'MZ세대 말투: 트렌디하고 감각적인 말투를 사용하세요. "찐", "갓", "미쳤다", "인생XX" 등 최신 유행어와 밈을 자연스럽게 활용합니다.',
  };

  const emojiInstruction = spec.emoji === 'with'
    ? '이모티콘 사용: 적절한 이모티콘이나 이모지를 2-4개 정도 자연스럽게 포함하세요. (예: 😊, 👍, ❤️, 🔥 등)'
    : '이모티콘 미사용: 이모티콘이나 이모지를 사용하지 마세요. 순수 텍스트로만 작성합니다.';

  const storeInfoSection = buildStoreInfoSection(storeInfo);

  return `${businessPrompt}
${storeInfoSection}
[생성 조건]
- 업체명/키워드: ${keyword}
- 글자수: ${lengthInfo.min}자 ~ ${lengthInfo.max}자 (현재 설정: ${lengthInfo.label} - ${lengthInfo.range})
- ${toneDescriptions[spec.tone]}
- ${emojiInstruction}

[중요 지침]
1. 실제 방문/이용한 것처럼 자연스럽게 작성
2. 구체적인 경험과 감상을 담을 것
3. 홍보성 글이 아닌 진정성 있는 후기처럼 작성
4. 지정된 글자수 범위를 반드시 준수
5. 반복적인 표현이나 문장 구조 피하기
6. 매장 정보가 제공된 경우, 메뉴명/가격/특징 등을 자연스럽게 언급

JSON 형식으로 응답해주세요:
{
  "review": "생성된 리뷰 텍스트"
}`;
}

/**
 * 배치 리뷰 생성 프롬프트 (여러 개 동시 생성)
 */
export function buildBatchReviewPrompt(
  keyword: string,
  businessPrompt: string,
  specs: ReviewSpec[],
  batchSize: number = 10,
  storeInfo?: StoreInfo
): string {
  const specsDescription = specs.slice(0, batchSize).map((spec, index) => {
    const lengthInfo = LENGTH_OPTIONS[spec.length];
    return `${index + 1}. 글자수: ${lengthInfo.label}(${lengthInfo.range}), 말투: ${spec.tone}, 이모티콘: ${spec.emoji === 'with' ? '포함' : '미포함'}`;
  }).join('\n');

  const toneDescriptions = `
- 20대: 친근하고 캐주얼, "~했어요", "진짜", "완전", "대박" 등
- 30대: 자연스럽고 균형 잡힌 톤
- 40대: 차분하고 신뢰감, 객관적 평가
- 50대: 정중하고 격식, "~습니다" 체
- MZ세대: 트렌디, "찐", "갓", "미쳤다", "인생XX" 등`;

  const storeInfoSection = buildStoreInfoSection(storeInfo);

  return `${businessPrompt}

[업체 정보]
업체명/키워드: ${keyword}
${storeInfoSection}
[생성할 리뷰 목록]
${specsDescription}

[말투 가이드]
${toneDescriptions}

[중요 지침]
1. 각 리뷰는 실제 방문/이용한 것처럼 자연스럽게 작성
2. 구체적인 경험과 감상을 담을 것
3. 홍보성 글이 아닌 진정성 있는 후기처럼 작성
4. 각 리뷰의 지정된 글자수 범위를 반드시 준수
5. 모든 리뷰가 서로 다른 관점과 표현을 사용할 것
6. 반복적인 문장 구조나 표현 절대 금지
7. 이모티콘 포함 설정된 리뷰에만 이모티콘 2-4개 사용
8. 매장 정보가 제공된 경우, 메뉴명/가격/특징 등을 자연스럽게 언급
9. 반드시 포함할 키워드가 있다면 각 리뷰에 자연스럽게 녹여서 사용
10. 피해야 할 키워드는 절대 사용하지 말 것

JSON 배열 형식으로 응답해주세요:
{
  "reviews": [
    {
      "index": 1,
      "text": "첫 번째 리뷰 텍스트",
      "length_type": "short|medium|long",
      "tone_type": "20s|30s|40s|50s|mz",
      "has_emoji": true|false
    },
    ...
  ]
}`;
}

/**
 * Gemini 응답 파싱
 */
export function parseGeminiReviewResponse(
  responseText: string,
  specs: ReviewSpec[]
): GeneratedReview[] {
  try {
    // JSON 파싱 시도
    let jsonText = responseText.trim();

    // 코드 블록 제거
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }

    const parsed = JSON.parse(jsonText.trim());

    if (parsed.reviews && Array.isArray(parsed.reviews)) {
      return parsed.reviews.map((review: { text: string; length_type: LengthOption; tone_type: ToneTarget; has_emoji: boolean }, index: number) => ({
        id: `gen-${Date.now()}-${index}`,
        script_text: review.text,
        length_type: review.length_type || specs[index]?.length || 'medium',
        tone_type: review.tone_type || specs[index]?.tone || '30s',
        has_emoji: review.has_emoji ?? specs[index]?.emoji === 'with',
        char_count: review.text.length,
        selected: true,
      }));
    }

    // 단일 리뷰 응답
    if (parsed.review) {
      return [{
        id: `gen-${Date.now()}-0`,
        script_text: parsed.review,
        length_type: specs[0]?.length || 'medium',
        tone_type: specs[0]?.tone || '30s',
        has_emoji: specs[0]?.emoji === 'with',
        char_count: parsed.review.length,
        selected: true,
      }];
    }

    throw new Error('알 수 없는 응답 형식');
  } catch (error) {
    console.error('Gemini 응답 파싱 오류:', error);
    console.error('원본 응답:', responseText);
    throw new Error('AI 응답 파싱에 실패했습니다.');
  }
}

/**
 * 대량 리뷰 생성 (배치 처리)
 */
export async function generateReviewsBatch(
  keyword: string,
  businessPrompt: string,
  specs: ReviewSpec[],
  onProgress?: (current: number, total: number) => void,
  storeInfo?: StoreInfo
): Promise<GeneratedReview[]> {
  const BATCH_SIZE = 10; // 한 번에 생성할 리뷰 수
  const allReviews: GeneratedReview[] = [];

  for (let i = 0; i < specs.length; i += BATCH_SIZE) {
    const batchSpecs = specs.slice(i, i + BATCH_SIZE);
    const prompt = buildBatchReviewPrompt(keyword, businessPrompt, batchSpecs, BATCH_SIZE, storeInfo);

    try {
      const response = await callGeminiAPI(prompt, {
        temperature: 0.95, // 다양성을 위해 높은 temperature
        maxOutputTokens: 8192,
      });

      const reviews = parseGeminiReviewResponse(response, batchSpecs);
      allReviews.push(...reviews);

      onProgress?.(Math.min(i + BATCH_SIZE, specs.length), specs.length);

      // Rate limiting - 배치 사이에 약간의 딜레이
      if (i + BATCH_SIZE < specs.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`배치 ${i / BATCH_SIZE + 1} 생성 실패:`, error);
      // 실패한 배치는 건너뛰고 계속 진행
    }
  }

  return allReviews;
}
