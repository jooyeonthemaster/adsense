/**
 * 네이버 플레이스 관련 유틸리티 함수
 */

/**
 * 네이버 플레이스 URL에서 MID(Place ID) 추출
 *
 * 지원하는 URL 형식:
 * - https://m.place.naver.com/restaurant/2052133358
 * - https://m.place.naver.com/restaurant/2052133358/home?entry=plt
 * - https://map.naver.com/p/entry/place/2052133358
 * - https://map.naver.com/p/entry/place/2052133358?lng=126.6494306&lat=37.3958625...
 *
 * @param url - 네이버 플레이스 URL
 * @returns MID (Place ID) 또는 null
 */
export function extractNaverPlaceMID(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // URL 트리밍
  const trimmedUrl = url.trim();

  // 정규식: place/ 또는 restaurant/ 또는 cafe/ 등 뒤의 숫자를 추출
  const patterns = [
    /place\/(\d+)/,           // map.naver.com/p/entry/place/123456
    /restaurant\/(\d+)/,      // m.place.naver.com/restaurant/123456
    /cafe\/(\d+)/,            // m.place.naver.com/cafe/123456
    /beauty\/(\d+)/,          // m.place.naver.com/beauty/123456
    /hospital\/(\d+)/,        // m.place.naver.com/hospital/123456
    /store\/(\d+)/,           // m.place.naver.com/store/123456
  ];

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * MID로 네이버 플레이스 업체 정보 가져오기
 *
 * @param mid - Naver Place MID
 * @returns 업체 정보 (업체명 포함) 또는 null
 */
export async function fetchBusinessInfoByMID(mid: string): Promise<{
  businessName: string;
  mid: string;
} | null> {
  if (!mid) {
    return null;
  }

  try {
    const response = await fetch(`/api/naver-place/${mid}`);

    if (!response.ok) {
      console.error('업체 정보 가져오기 실패:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.success && data.businessName) {
      return {
        businessName: data.businessName,
        mid: data.mid,
      };
    }

    return null;
  } catch (error) {
    console.error('업체 정보 가져오기 중 오류:', error);
    return null;
  }
}

/**
 * 플레이스 URL의 유효성 검증
 *
 * @param url - 검증할 URL
 * @returns 유효한 네이버 플레이스 URL인지 여부
 */
export function isValidNaverPlaceUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();

  // 네이버 플레이스 도메인 확인
  const validDomains = [
    'map.naver.com',
    'm.place.naver.com',
    'place.naver.com',
  ];

  const hasValidDomain = validDomains.some(domain => trimmedUrl.includes(domain));

  // MID 추출 가능 여부 확인
  const hasMID = extractNaverPlaceMID(trimmedUrl) !== null;

  return hasValidDomain && hasMID;
}

/**
 * 플레이스 URL을 정규화된 형식으로 변환
 *
 * @param mid - Place MID
 * @returns 정규화된 URL
 */
export function normalizeNaverPlaceUrl(mid: string): string {
  return `https://map.naver.com/p/entry/place/${mid}`;
}
