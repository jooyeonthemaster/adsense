import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // Get all place submissions for this client
    const { data: submissions, error } = await supabase
      .from('place_submissions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reward submissions:', error);
      return NextResponse.json(
        { error: '제출 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Fetch daily records to calculate progress
    const { data: allDailyRecords } = await supabase
      .from('place_submissions_daily_records')
      .select('submission_id, actual_count, date');

    // Create a map of submission_id to progress info
    const progressMap = new Map<string, { completed: number; currentDay: number }>();
    if (allDailyRecords) {
      allDailyRecords.forEach((record: any) => {
        const current = progressMap.get(record.submission_id) || { completed: 0, currentDay: 0 };
        progressMap.set(record.submission_id, {
          completed: current.completed + record.actual_count,
          currentDay: current.currentDay + 1,
        });
      });
    }

    // Add progress to each submission
    const submissionsWithProgress = (submissions || []).map((sub: any) => {
      const progress = progressMap.get(sub.id) || { completed: 0, currentDay: 0 };
      const totalExpected = sub.daily_count * sub.total_days;
      const progressPercentage = totalExpected > 0
        ? Math.min(100, Math.round((progress.completed / totalExpected) * 100))
        : 0;

      return {
        ...sub,
        completed_count: progress.completed,
        current_day: progress.currentDay,
        progress_percentage: progressPercentage,
      };
    });

    return NextResponse.json({
      success: true,
      submissions: submissionsWithProgress,
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/reward:', error);
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
      place_mid,
      daily_count,
      total_days,
      total_points,
      start_date,
      media_type = 'twoople', // 투플 또는 유레카
    } = body;

    // Validation
    if (!company_name || !place_url || !place_mid) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!daily_count || daily_count < 100) {
      return NextResponse.json(
        { error: '일 접수량은 최소 100타 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (!total_days || total_days < 3 || total_days > 7) {
      return NextResponse.json(
        { error: '구동일수는 3일 이상부터 접수가 가능합니다. (최대 7일)' },
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

    // Get price based on media type (투플: twoople-reward, 블루: eureka-reward)
    const pricingSlug = media_type === 'eureka' ? 'eureka-reward' : 'twoople-reward';
    const mediaName = media_type === 'eureka' ? '블루' : '투플';
    let pricePerUnit = await getProductPrice(user.id, pricingSlug);

    if (!pricePerUnit) {
      return NextResponse.json(
        { error: `${mediaName} 상품 가격 정보를 찾을 수 없습니다.` },
        { status: 400 }
      );
    }

    // Calculate points (일 접수량 × 구동일수 × 단가)
    const totalCount = daily_count * total_days;
    const calculatedPoints = Math.round(totalCount * pricePerUnit);

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
        place_mid,
        daily_count,
        total_days,
        total_points,
        status: 'pending',
        start_date: start_date || null, // 클라이언트가 선택한 시작일
        media_type, // 투플 또는 유레카
        notes: null,
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating reward submission:', submissionError);
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
      description: `${mediaName} 리워드 접수 (${company_name} - ${daily_count}타/일 × ${total_days}일)`,
    });

    // Revalidate all dashboard pages to show updated points immediately
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      submission,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/reward:', error);
    return NextResponse.json(
      { error: '접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
