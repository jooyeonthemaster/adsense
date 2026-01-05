import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// POST /api/submissions/experience/submit
// 고객이 체험단 마케팅 신청
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      serviceType, // 'blog' | 'xiaohongshu' | 'reporter' | 'influencer'
      businessName,
      placeUrl,
      teamCount,
      keywords,
      guideline,
      availableDays,
      availableTimeStart,
      availableTimeEnd,
      providedItems,
      // 기자단 전용
      publishDate,
      progressKeyword,
      imageUrls, // 이미지 URL 배열
    } = body;

    // 필수 필드 검증
    if (!serviceType || !businessName || !placeUrl || !teamCount) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // ServiceType 매핑 (URL 파라미터 → DB 값)
    const experienceTypeMap: Record<string, string> = {
      'blog': 'blog-experience',
      'xiaohongshu': 'xiaohongshu',
      'reporter': 'journalist',
      'journalist': 'journalist',
      'influencer': 'influencer',
    };

    const experienceType = experienceTypeMap[serviceType] || 'blog-experience';

    const supabase = await createClient();

    // 클라이언트별 설정된 가격 조회 (is_active 체크 포함)
    const { data: priceData, error: priceError } = await supabase
      .from('client_product_prices')
      .select('price_per_unit, product_categories!inner(slug, is_active)')
      .eq('client_id', user.id)
      .eq('product_categories.slug', experienceType)
      .eq('is_visible', true)
      .eq('product_categories.is_active', true)
      .single();

    // 가격 정보가 없으면 에러 반환
    if (priceError || !priceData?.price_per_unit) {
      console.error('Price not configured for experience type:', experienceType);
      return NextResponse.json(
        { error: '상품 가격이 설정되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 400 }
      );
    }

    const pricePerTeam = priceData.price_per_unit;
    const totalPoints = teamCount * pricePerTeam;

    // 키워드 배열 생성
    const keywordArray = keywords?.map((kw: any) => `${kw.main} ${kw.sub}`.trim()) || [];

    // 가이드라인 텍스트 생성
    let guideText = guideline || '';

    // 블로그/샤오홍슈/인플루언서: 제공내역, 방문가능요일 추가
    if (['blog-experience', 'xiaohongshu', 'influencer'].includes(experienceType)) {
      guideText += `\n\n[제공내역]\n${providedItems || ''}`;
      if (availableDays && availableDays.length > 0) {
        guideText += `\n\n[방문가능요일]\n${availableDays.join(', ')}`;
        guideText += `\n[방문가능시간]\n${availableTimeStart} ~ ${availableTimeEnd}`;
      }
    }

    // 기자단: 발행일, 진행키워드 추가
    if (experienceType === 'journalist') {
      guideText += `\n\n[희망 발행일]\n${publishDate || ''}`;
      guideText += `\n\n[진행 키워드]\n${progressKeyword || ''}`;
    }

    // Get client's current points
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('points')
      .eq('id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: '거래처 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if client has enough points
    if (client.points < totalPoints) {
      return NextResponse.json(
        { error: '포인트가 부족합니다.' },
        { status: 400 }
      );
    }

    // Deduct points
    const newBalance = client.points - totalPoints;
    const { error: updateError } = await supabase
      .from('clients')
      .update({ points: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating points:', updateError);
      return NextResponse.json(
        { error: '포인트 차감 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Generate submission number using database function
    const { data: submissionNumberData, error: snError } = await supabase
      .rpc('generate_submission_number', { p_product_code: 'EX' });

    if (snError) {
      console.error('Error generating submission number:', snError);
      // Rollback points
      await supabase
        .from('clients')
        .update({ points: client.points })
        .eq('id', user.id);
      return NextResponse.json(
        { error: '접수번호 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 체험단 신청 저장
    const { data: submission, error } = await supabase
      .from('experience_submissions')
      .insert({
        client_id: user.id,
        submission_number: submissionNumberData,
        company_name: businessName,
        place_url: placeUrl,
        experience_type: experienceType,
        team_count: teamCount,
        keywords: keywordArray,
        guide_text: guideText.trim(),
        available_days: availableDays || null,
        available_time_start: availableTimeStart || null,
        available_time_end: availableTimeEnd || null,
        provided_items: providedItems || null,
        image_urls: imageUrls || null, // 이미지 URL 배열 저장
        total_points: totalPoints,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating experience submission:', error);
      // Rollback points
      await supabase
        .from('clients')
        .update({ points: client.points })
        .eq('id', user.id);

      return NextResponse.json(
        { error: '접수 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Create point transaction record
    const experienceTypeLabels: Record<string, string> = {
      'blog-experience': '블로그 체험단',
      'xiaohongshu': '샤오홍슈',
      'journalist': '실계정 기자단',
      'influencer': '블로그 인플루언서',
    };

    await supabase.from('point_transactions').insert({
      client_id: user.id,
      transaction_type: 'deduct',
      amount: -totalPoints,
      balance_after: newBalance,
      reference_type: 'experience_submission',
      reference_id: submission.id,
      description: `체험단 마케팅 접수 (${businessName} - ${experienceTypeLabels[experienceType] || experienceType})`,
    });

    // Revalidate all dashboard pages to show updated points immediately
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      message: '체험단 마케팅 신청이 완료되었습니다.',
      submission_id: submission.id,
      total_points: totalPoints,
    });
  } catch (error: any) {
    console.error('Error in POST /api/submissions/experience/submit:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}