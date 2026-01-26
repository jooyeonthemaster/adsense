/**
 * 카카오맵 플레이스 관련 유틸리티 함수
 */

/**
 * 카카오맵 플레이스 URL에서 MID(Place ID) 추출
 *
 * 지원하는 URL 형식:
 * - https://place.map.kakao.com/1087073078
 * - https://place.map.kakao.com/1087073078?
 * - https://map.kakao.com/link/map/업체명,37.123,127.456
 * - https://kko.to/abc123 (단축 URL)
 *
 * @param url - 카카오맵 플레이스 URL
 * @returns MID (Place ID) 또는 null
 */
export function extractKakaoPlaceMID(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // URL 트리밍
  const trimmedUrl = url.trim();

  // 다양한 카카오맵 URL 형식 지원
  const patterns = [
    /place\.map\.kakao\.com\/(\d+)/,  // place.map.kakao.com/123456
    /map\.kakao\.com\/.*[?&]itemId=(\d+)/, // map.kakao.com/?itemId=123456
    /map\.kakao\.com\/link\/(?:to|map|roadview)\/(\d+)/, // map.kakao.com/link/to/123456
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
 * MID로 카카오맵 플레이스 업체 정보 가져오기
 *
 * @param mid - Kakao Place MID
 * @returns 업체 정보 (업체명 포함) 또는 null
 */
export async function fetchKakaoBusinessInfoByMID(mid: string): Promise<{
  businessName: string;
  mid: string;
} | null> {
  if (!mid) {
    return null;
  }

  try {
    const response = await fetch(`/api/kakao-place/${mid}`);

    if (!response.ok) {
      console.error('카카오맵 업체 정보 가져오기 실패:', response.status);
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
    console.error('카카오맵 업체 정보 가져오기 중 오류:', error);
    return null;
  }
}

/**
 * 카카오맵 플레이스 URL의 유효성 검증
 *
 * @param url - 검증할 URL
 * @returns 유효한 카카오맵 플레이스 URL인지 여부
 */
export function isValidKakaoPlaceUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();

  // 카카오맵 플레이스 도메인 확인
  const validDomains = [
    'place.map.kakao.com',
    'map.kakao.com',
    'kko.to', // 단축 URL
  ];

  const hasValidDomain = validDomains.some(domain => trimmedUrl.includes(domain));

  // MID 추출 가능 여부 확인
  const hasMID = extractKakaoPlaceMID(trimmedUrl) !== null;

  return hasValidDomain && hasMID;
}

/**
 * 카카오맵 플레이스 URL을 정규화된 형식으로 변환
 *
 * @param mid - Place MID
 * @returns 정규화된 URL
 */
export function normalizeKakaoPlaceUrl(mid: string): string {
  return `https://place.map.kakao.com/${mid}`;
}
