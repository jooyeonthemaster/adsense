import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // Get all cafe marketing submissions for this client
    const { data: submissions, error } = await supabase
      .from('cafe_marketing_submissions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cafe submissions:', error);
      return NextResponse.json(
        { error: '제출 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Fetch content items to calculate progress (콘텐츠 기반) - service client 사용 (RLS bypass)
    const serviceClient = createServiceClient();
    const { data: allContentItems } = await serviceClient
      .from('cafe_content_items')
      .select('submission_id');

    // Create a map of submission_id to content item count
    const completedCountMap = new Map<string, number>();
    if (allContentItems) {
      allContentItems.forEach((item: any) => {
        const currentCount = completedCountMap.get(item.submission_id) || 0;
        completedCountMap.set(item.submission_id, currentCount + 1);
      });
    }

    // Add progress to each submission
    const submissionsWithProgress = (submissions || []).map((sub: any) => {
      const completedCount = completedCountMap.get(sub.id) || 0;
      const progressPercentage = sub.total_count > 0
        ? Math.min(100, Math.round((completedCount / sub.total_count) * 100))
        : 0;

      return {
        ...sub,
        completed_count: completedCount,
        progress_percentage: progressPercentage,
      };
    });

    return NextResponse.json({
      success: true,
      submissions: submissionsWithProgress,
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/cafe:', error);
    return NextResponse.json(
      { error: '제출 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const body = await request.json();
    const {
      company_name,
      place_url,
      content_type,
      region,
      cafe_details,
      has_photo,
      guideline,
      photo_urls,
      total_points,
    } = body;

    // Validation
    if (!company_name || !content_type || !region || !cafe_details || !Array.isArray(cafe_details)) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (cafe_details.length === 0) {
      return NextResponse.json(
        { error: '최소 1개의 카페를 선택해주세요.' },
        { status: 400 }
      );
    }

    // Validate cafe_details structure and calculate total_count
    let total_count = 0;
    for (const cafe of cafe_details) {
      if (!cafe.name || !cafe.count || cafe.count < 1) {
        return NextResponse.json(
          { error: '카페별 발행 건수를 올바르게 입력해주세요.' },
          { status: 400 }
        );
      }
      total_count += cafe.count;
    }

    if (total_count < 1) {
      return NextResponse.json(
        { error: '총 발행 건수는 최소 1건입니다.' },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ['review', 'info'];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: '올바른 콘텐츠 타입이 아닙니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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

    // Get price for cafe marketing
    let pricePerUnit = await getProductPrice(user.id, 'cafe-marketing');

    if (!pricePerUnit) {
      return NextResponse.json(
        { error: '상품 가격 정보를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // Calculate points (발행 건당 단가)
    const calculatedPoints = pricePerUnit * total_count;

    if (Math.abs(calculatedPoints - total_points) > 1) {
      return NextResponse.json(
        { error: '포인트 계산이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // Check if client has enough points
    if (client.points < total_points) {
      return NextResponse.json(
        { error: '포인트가 부족합니다.' },
        { status: 400 }
      );
    }

    // Deduct points
    const newBalance = client.points - total_points;
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
      .rpc('generate_submission_number', { p_product_code: 'CM' });

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

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('cafe_marketing_submissions')
      .insert({
        client_id: user.id,
        submission_number: submissionNumberData,
        company_name,
        place_url: place_url || null,
        content_type,
        region,
        cafe_details,
        total_count,
        has_photo: has_photo || false,
        guideline: guideline || null,
        photo_urls: Array.isArray(photo_urls) && photo_urls.length > 0 ? photo_urls : null,
        script_status: 'pending',
        script_url: null,
        total_points,
        status: 'pending',
        notes: null,
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating cafe submission:', submissionError);
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
    await supabase.from('point_transactions').insert({
      client_id: user.id,
      transaction_type: 'deduct',
      amount: -total_points,
      balance_after: newBalance,
      reference_type: 'cafe_submission',
      reference_id: submission.id,
      description: `카페 침투 마케팅 접수 (${company_name} - ${region})`,
    });

    // Revalidate all dashboard pages to show updated points immediately
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      submission,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/cafe:', error);
    return NextResponse.json(
      { error: '접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
