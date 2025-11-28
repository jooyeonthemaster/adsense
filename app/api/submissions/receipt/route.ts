import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // Get all receipt review submissions for this client
    const { data: submissions, error } = await supabase
      .from('receipt_review_submissions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching receipt submissions:', error);
      return NextResponse.json(
        { error: '접수 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Fetch daily records to calculate progress
    const { data: allDailyRecords } = await supabase
      .from('receipt_review_daily_records')
      .select('submission_id, actual_count');

    // Create a map of submission_id to total actual count
    const actualCountMap = new Map<string, number>();
    if (allDailyRecords) {
      allDailyRecords.forEach((record: any) => {
        const currentCount = actualCountMap.get(record.submission_id) || 0;
        actualCountMap.set(record.submission_id, currentCount + record.actual_count);
      });
    }

    // Add progress to each submission
    const submissionsWithProgress = (submissions || []).map((sub: any) => {
      const actualCount = actualCountMap.get(sub.id) || 0;
      const progressPercentage = sub.total_count > 0
        ? Math.min(100, Math.round((actualCount / sub.total_count) * 100))
        : 0;

      return {
        ...sub,
        actual_count_total: actualCount,
        progress_percentage: progressPercentage,
      };
    });

    return NextResponse.json({
      success: true,
      submissions: submissionsWithProgress,
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/receipt:', error);
    return NextResponse.json(
      { error: '접수 목록을 불러오는 중 오류가 발생했습니다.' },
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
      daily_count,
      total_days,
      total_count,
      total_points,
      business_license_url,
      photo_urls,
      notes,
    } = body;

    // Validation
    if (!company_name || !place_url || !total_count || !daily_count) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (daily_count < 1 || daily_count > 10) {
      return NextResponse.json(
        { error: '일 발행수량은 최소 1건, 최대 10건입니다.' },
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

    // Verify pricing (가격이 설정되지 않으면 에러 반환)
    const pricePerUnit = await getProductPrice(user.id, 'receipt-review');

    if (!pricePerUnit) {
      console.error('Price not configured for receipt-review, client:', user.id);
      return NextResponse.json(
        { error: '상품 가격이 설정되지 않았습니다. 관리자에게 문의하세요.' },
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
      .from('receipt_review_submissions')
      .insert({
        client_id: user.id,
        company_name,
        place_url,
        daily_count,
        total_count,
        has_photo: !!(photo_urls && photo_urls.length > 0),
        has_script: false, // 기본값
        total_points,
        business_license_url,
        photo_urls,
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
      reference_type: 'receipt_submission',
      reference_id: submission.id,
      description: `영수증 리뷰 접수 (${company_name})`,
    });

    // Revalidate all dashboard pages to show updated points immediately
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      submission,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/receipt:', error);
    return NextResponse.json(
      { error: '접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
