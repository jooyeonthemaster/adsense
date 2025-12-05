import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const body = await request.json();
    const { company_name, place_url, daily_count, total_days, total_points, notes } = body;

    // Validation
    if (!company_name || !place_url || !daily_count || !total_days) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (daily_count < 100) {
      return NextResponse.json(
        { error: '최소 일 100타 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    if (total_days < 3 || total_days > 7) {
      return NextResponse.json(
        { error: '구동일수는 최소 3일, 최대 7일입니다.' },
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

    // Verify pricing
    const pricePerUnit = await getProductPrice(user.id, 'place-traffic');
    if (!pricePerUnit) {
      return NextResponse.json(
        { error: '상품 가격 정보를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    const calculatedPoints = pricePerUnit * daily_count * total_days;
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
      .rpc('generate_submission_number', { p_product_code: 'PL' });

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
      .from('place_submissions')
      .insert({
        client_id: user.id,
        submission_number: submissionNumberData,
        company_name,
        place_url,
        daily_count,
        total_days,
        total_points,
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
      reference_type: 'place_submission',
      reference_id: submission.id,
      description: `플레이스 유입 접수 (${company_name})`,
    });

    // Revalidate all dashboard pages to show updated points immediately
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      submission,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/place:', error);
    return NextResponse.json(
      { error: '접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
