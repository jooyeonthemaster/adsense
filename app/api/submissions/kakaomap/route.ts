import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // Get all kakaomap review submissions for this client
    const { data: submissions, error } = await supabase
      .from('kakaomap_review_submissions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching kakaomap submissions:', error);
      return NextResponse.json(
        { error: '접수 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Fetch daily records to calculate progress
    const { data: allDailyRecords } = await supabase
      .from('kakaomap_review_daily_records')
      .select('submission_id, actual_count');

    // Create a map of submission_id to total actual count
    const actualCountMap = new Map<string, number>();
    if (allDailyRecords) {
      allDailyRecords.forEach((record: any) => {
        const currentCount = actualCountMap.get(record.submission_id) || 0;
        actualCountMap.set(record.submission_id, currentCount + record.actual_count);
      });
    }

    // For each submission, get related data (content items, messages count)
    const submissionsWithDetails = await Promise.all(
      (submissions || []).map(async (submission) => {
        // Get content items count (전체)
        const { count: contentCount } = await supabase
          .from('kakaomap_content_items')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', submission.id);

        // Get completed count (리포트에 등록된 것만 = review_registered_date가 있는 것)
        const { count: completedCount } = await supabase
          .from('kakaomap_content_items')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', submission.id)
          .not('review_registered_date', 'is', null);

        // Get unread messages count
        const { count: unreadCount } = await supabase
          .from('kakaomap_messages')
          .select('*', { count: 'exact', head: true })
          .eq('submission_id', submission.id)
          .eq('is_read', false)
          .eq('sender_type', 'admin');

        // Calculate progress based on completed count (리포트 등록된 것만)
        const actualCount = actualCountMap.get(submission.id) || 0;
        const progressPercentage = submission.total_count > 0
          ? Math.min(100, Math.round(((completedCount || 0) / submission.total_count) * 100))
          : 0;

        return {
          ...submission,
          content_items_count: contentCount || 0,
          completed_count: completedCount || 0,
          unread_messages_count: unreadCount || 0,
          actual_count_total: actualCount,
          progress_percentage: progressPercentage,
        };
      })
    );

    return NextResponse.json({
      success: true,
      submissions: submissionsWithDetails,
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/kakaomap:', error);
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
      kakaomap_url,
      daily_count,
      total_count,
      total_days,
      total_points,
      start_date,
      script,
      guide_text,
      photo_urls,
      script_urls,
      text_review_count,
      photo_review_count,
      photo_ratio,
      star_rating,
      script_type,
      notes,
    } = body;

    // Validation
    if (!company_name || !kakaomap_url || !total_count) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (total_count < 10) {
      return NextResponse.json(
        { error: '최소 10타 이상 입력해주세요.' },
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
    const pricePerUnit = await getProductPrice(user.id, 'kakaomap-review');
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

    // Generate submission number using database function
    const { data: submissionNumberData, error: snError } = await supabase
      .rpc('generate_submission_number', { p_product_code: 'KM' });

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
    // Determine has_photo based on photo_review_count
    const hasPhoto = photo_review_count > 0;

    // guide_text 또는 script를 사용 (하위 호환성)
    const finalGuideText = guide_text || script || null;

    console.log('[DEBUG] Creating kakaomap submission with data:', {
      client_id: user.id,
      submission_number: submissionNumberData,
      company_name,
      kakaomap_url,
      daily_count: daily_count || 1,
      total_count,
      total_days: total_days || Math.ceil(total_count / (daily_count || 1)),
      has_photo: hasPhoto,
      text_review_count: text_review_count || 0,
      photo_review_count: photo_review_count || 0,
      guide_text: finalGuideText,
      photo_urls,
      script_urls,
      photo_ratio,
      star_rating,
      script_type,
      total_points,
      notes,
      status: 'pending',
    });

    const { data: submission, error: submissionError } = await supabase
      .from('kakaomap_review_submissions')
      .insert({
        client_id: user.id,
        submission_number: submissionNumberData,
        company_name,
        kakaomap_url,
        daily_count: daily_count || 1,
        total_count,
        total_days: total_days || Math.ceil(total_count / (daily_count || 1)),
        start_date: start_date || null,
        has_photo: hasPhoto,
        text_review_count: text_review_count || 0,
        photo_review_count: photo_review_count || 0,
        guide_text: finalGuideText,
        photo_urls,
        script_urls,
        photo_ratio,
        star_rating,
        script_type,
        total_points,
        notes,
        status: 'pending',
      })
      .select()
      .single();

    if (submissionError) {
      console.error('[ERROR] Failed to create kakaomap submission:', submissionError);
      console.error('[ERROR] Supabase error details:', JSON.stringify(submissionError, null, 2));
      // Rollback points
      await supabase
        .from('clients')
        .update({ points: client.points })
        .eq('id', user.id);

      return NextResponse.json(
        { error: `접수 생성 중 오류가 발생했습니다: ${submissionError.message || '알 수 없는 오류'}` },
        { status: 500 }
      );
    }

    // Create point transaction record
    await supabase.from('point_transactions').insert({
      client_id: user.id,
      transaction_type: 'deduct',
      amount: -total_points,
      balance_after: newBalance,
      reference_type: 'kakaomap_submission',
      reference_id: submission.id,
      description: `카카오맵 리뷰 접수 (${company_name})`,
    });

    // Revalidate all dashboard pages to show updated points immediately
    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      submission,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/kakaomap:', error);
    return NextResponse.json(
      { error: '접수 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
