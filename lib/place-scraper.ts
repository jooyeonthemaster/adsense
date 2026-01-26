/**
 * 서버 사이드 플레이스 업체명 스크래핑 유틸리티
 */

/**
 * 네이버 플레이스 MID로 업체명 가져오기 (서버 사이드)
 */
export async function fetchNaverBusinessName(mid: string): Promise<string | null> {
  if (!mid || !/^\d+$/.test(mid)) {
    return null;
  }

  try {
    const placeUrl = `https://m.place.naver.com/place/${mid}`;

    const response = await fetch(placeUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      console.error(`[Place Scraper] Naver HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    let businessName: string | null = null;

    // 방법 1: Open Graph title 메타태그
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
    if (ogTitleMatch && ogTitleMatch[1]) {
      businessName = ogTitleMatch[1].trim();
    }

    // 방법 2: title 태그
    if (!businessName) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1].trim();
        const parts = title.split(':');
        if (parts.length > 0) {
          businessName = parts[0].trim();
        }
      }
    }

    // 방법 3: JSON-LD 구조화 데이터
    if (!businessName) {
      const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
      if (jsonLdMatch && jsonLdMatch[1]) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.name) {
            businessName = jsonData.name;
          }
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    }

    if (!businessName) {
      return null;
    }

    // 불필요한 텍스트 제거
    return businessName
      .replace(/\s*:\s*네이버.*$/i, '')
      .replace(/\s*-\s*네이버.*$/i, '')
      .replace(/\s*\|\s*네이버.*$/i, '')
      .trim();
  } catch (error) {
    console.error('[Place Scraper] Naver error:', error);
    return null;
  }
}

/**
 * 카카오맵 플레이스 MID로 업체명 가져오기 (서버 사이드)
 */
export async function fetchKakaoBusinessName(mid: string): Promise<string | null> {
  if (!mid || !/^\d+$/.test(mid)) {
    return null;
  }

  try {
    const placeUrl = `https://place.map.kakao.com/${mid}`;

    const response = await fetch(placeUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      console.error(`[Place Scraper] Kakao HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    let businessName: string | null = null;

    // 방법 1: Open Graph title 메타태그
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
    if (ogTitleMatch && ogTitleMatch[1]) {
      businessName = ogTitleMatch[1].trim();
    }

    // 방법 2: title 태그
    if (!businessName) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        businessName = titleMatch[1].trim();
      }
    }

    if (!businessName) {
      return null;
    }

    // 불필요한 텍스트 제거
    return businessName
      .replace(/\s*-\s*카카오맵.*$/i, '')
      .replace(/\s*\|\s*카카오맵.*$/i, '')
      .trim();
  } catch (error) {
    console.error('[Place Scraper] Kakao error:', error);
    return null;
  }
}

/**
 * URL에서 플랫폼 감지 및 업체명 가져오기
 */
export async function fetchBusinessNameFromUrl(url: string): Promise<{
  businessName: string | null;
  mid: string | null;
  platform: 'naver' | 'kakao' | null;
}> {
  if (!url) {
    return { businessName: null, mid: null, platform: null };
  }

  const trimmedUrl = url.trim();

  // 네이버 플레이스 확인
  if (trimmedUrl.includes('naver.com') || trimmedUrl.includes('naver.me')) {
    const patterns = [
      /place\/(\d+)/,
      /restaurant\/(\d+)/,
      /cafe\/(\d+)/,
      /beauty\/(\d+)/,
      /hospital\/(\d+)/,
      /store\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = trimmedUrl.match(pattern);
      if (match && match[1]) {
        const mid = match[1];
        const businessName = await fetchNaverBusinessName(mid);
        return { businessName, mid, platform: 'naver' };
      }
    }
  }

  // 카카오맵 확인
  if (trimmedUrl.includes('kakao.com')) {
    const patterns = [
      // place.map.kakao.com/123456 형식
      /place\.map\.kakao\.com\/(\d+)/,
      // map.kakao.com/?itemId=123456 형식
      /map\.kakao\.com\/.*[?&]itemId=(\d+)/,
      // map.kakao.com/link/to/123456 형식
      /map\.kakao\.com\/link\/(?:to|map|roadview)\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = trimmedUrl.match(pattern);
      if (match && match[1]) {
        const mid = match[1];
        const businessName = await fetchKakaoBusinessName(mid);
        return { businessName, mid, platform: 'kakao' };
      }
    }
  }

  return { businessName: null, mid: null, platform: null };
}
