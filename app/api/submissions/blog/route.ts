import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const body = await request.json();
    const {
      company_name,
      distribution_type,
      content_type,
      place_url,
      daily_count,
      total_count,
      total_points,
      keywords,
      notes,
    } = body;

    // Validation
    if (!company_name || !distribution_type || !content_type || !place_url || !daily_count) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (daily_count < 1 || daily_count > 3) {
      return NextResponse.json(
        { error: '일 타수는 최소 1타, 최대 3타입니다.' },
        { status: 400 }
      );
    }

    if (total_count > 30) {
      return NextResponse.json(
        { error: '총 타수는 최대 30타입니다.' },
        { status: 400 }
      );
    }

    // Validate distribution type
    const validDistributionTypes = ['reviewer', 'video', 'automation'];
    if (!validDistributionTypes.includes(distribution_type)) {
      return NextResponse.json(
        { error: '올바른 배포 타입이 아닙니다.' },
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

    // Get price for selected distribution type
    const categoryMap: Record<string, string> = {
      reviewer: 'blog-reviewer',
      video: 'blog-video',
      automation: 'blog-automation',
    };

    let pricePerUnit = await getProductPrice(user.id, categoryMap[distribution_type]);

    // If specific sub-type price not found, try blog-distribution as fallback
    if (!pricePerUnit) {
      pricePerUnit = await getProductPrice(user.id, 'blog-distribution');
    }

    if (!pricePerUnit) {
      return NextResponse.json(
        { error: '상품 가격 정보를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

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

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('blog_distribution_submissions')
      .insert({
        client_id: user.id,
        company_name,
        distribution_type,
        content_type,
        place_url,
        daily_count,
        total_count,
        total_points,
        keywords,
        notes,
        status: 'pending',
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
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
      reference_type: 'blog_submission',
      reference_id: submission.id,
      description: `블로그 배포 접수 (${company_name} - ${distribution_type})`,
    });

    // Revalidate all dashboard pages to show updated points immediately
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      submission,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/blog:', error);
    return NextResponse.json(
      { error: '접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
