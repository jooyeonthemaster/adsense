import { NextRequest, NextResponse } from 'next/server';

/**
 * 카카오맵 플레이스 업체 정보 조회 API
 *
 * GET /api/kakao-place/[mid]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mid: string }> }
) {
  try {
    const { mid } = await params;

    if (!mid || !/^\d+$/.test(mid)) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 MID입니다.',
        },
        { status: 400 }
      );
    }

    console.log(`[Kakao Place API] MID ${mid} 업체 정보 조회 시작`);

    // 카카오맵 플레이스 페이지 URL 생성
    const placeUrl = `https://place.map.kakao.com/${mid}`;

    // 페이지 HTML 가져오기
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
      console.error(`[Kakao Place API] HTTP ${response.status}: ${response.statusText}`);
      return NextResponse.json(
        {
          success: false,
          error: '카카오맵 플레이스 페이지를 불러올 수 없습니다.',
        },
        { status: 500 }
      );
    }

    const html = await response.text();

    // 업체명 추출 (여러 방법 시도)
    let businessName: string | null = null;

    // 방법 1: Open Graph title 메타태그
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
    if (ogTitleMatch && ogTitleMatch[1]) {
      businessName = ogTitleMatch[1].trim();
      console.log(`[Kakao Place API] og:title에서 업체명 추출: ${businessName}`);
    }

    // 방법 2: title 태그
    if (!businessName) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        // "업체명 | 카카오맵" 형식에서 업체명만 추출
        const title = titleMatch[1].trim();
        const parts = title.split('|');
        if (parts.length > 0) {
          businessName = parts[0].trim();
          console.log(`[Kakao Place API] title 태그에서 업체명 추출: ${businessName}`);
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
            console.log(`[Kakao Place API] JSON-LD에서 업체명 추출: ${businessName}`);
          }
        } catch (e) {
          console.error('[Kakao Place API] JSON-LD 파싱 실패:', e);
        }
      }
    }

    // 방법 4: og:site_name 메타태그 (일부 카카오맵 페이지에서 사용)
    if (!businessName) {
      const ogSiteNameMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/);
      if (ogSiteNameMatch && ogSiteNameMatch[1]) {
        businessName = ogSiteNameMatch[1].trim();
        console.log(`[Kakao Place API] og:site_name에서 업체명 추출: ${businessName}`);
      }
    }

    // 방법 5: data-name 속성 검색
    if (!businessName) {
      const dataNameMatch = html.match(/data-name="([^"]+)"/);
      if (dataNameMatch && dataNameMatch[1]) {
        businessName = dataNameMatch[1].trim();
        console.log(`[Kakao Place API] data-name에서 업체명 추출: ${businessName}`);
      }
    }

    if (!businessName) {
      console.error('[Kakao Place API] 업체명을 찾을 수 없습니다.');
      return NextResponse.json(
        {
          success: false,
          error: '업체 정보를 찾을 수 없습니다. MID가 올바른지 확인해주세요.',
        },
        { status: 404 }
      );
    }

    // 업체명 후처리: 불필요한 텍스트 제거
    businessName = businessName
      .replace(/\s*\|\s*카카오맵.*$/i, '') // " | 카카오맵" 제거
      .replace(/\s*-\s*카카오맵.*$/i, '')  // " - 카카오맵" 제거
      .replace(/\s*:\s*카카오맵.*$/i, '')  // " : 카카오맵" 제거
      .trim();

    // 성공 응답
    console.log(`[Kakao Place API] 성공: MID ${mid} → ${businessName}`);
    return NextResponse.json({
      success: true,
      businessName,
      mid,
      placeUrl,
    });
  } catch (error) {
    console.error('[Kakao Place API] 오류 발생:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
