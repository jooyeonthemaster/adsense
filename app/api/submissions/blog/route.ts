import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { getProductPrice } from '@/lib/pricing';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    // Get all blog distribution submissions for this client
    const { data: submissions, error } = await supabase
      .from('blog_distribution_submissions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: '제출 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Fetch content items to calculate progress (content_items 기반 진행률)
    const { data: allContentItems } = await supabase
      .from('blog_content_items')
      .select('submission_id');

    // Create a map of submission_id to total content count
    const completedCountMap = new Map<string, number>();
    if (allContentItems) {
      allContentItems.forEach((item: { submission_id: string }) => {
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
    console.error('Error in GET /api/submissions/blog:', error);
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
      distribution_type,
      content_type,
      place_url,
      daily_count,
      total_count,
      total_points,
      keywords,
      notes,
      account_id,
      charge_count,
    } = body;

    // Validation
    if (!company_name || !distribution_type || !content_type || daily_count === undefined) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (daily_count < 3) {
      return NextResponse.json(
        { error: '일 접수량은 최소 3건입니다.' },
        { status: 400 }
      );
    }

    if (total_count < 30) {
      return NextResponse.json(
        { error: '총 접수량은 최소 30건입니다. (최소 10일 × 3건)' },
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

    // Get client's current points and approval status
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('points, auto_distribution_approved')
      .eq('id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: '거래처 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Validate external account usage for automation distribution
    if (account_id && distribution_type === 'automation') {
      if (!client.auto_distribution_approved) {
        return NextResponse.json(
          { error: '자동화 배포 외부 계정 충전은 승인된 회원만 사용할 수 있습니다. 관리자에게 문의하세요.' },
          { status: 403 }
        );
      }
    }

    // Get price for selected distribution type
    const categoryMap: Record<string, string> = {
      reviewer: 'reviewer-distribution',
      video: 'video-distribution',
      automation: 'auto-distribution',
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

    // Generate submission number using database function
    const { data: submissionNumberData, error: snError } = await supabase
      .rpc('generate_submission_number', { p_product_code: 'BD' });

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
    // keywords가 유효한 배열인지 확인하고, 아니면 빈 배열로 변환
    const validKeywords = Array.isArray(keywords) && keywords.length > 0 ? keywords : null;

    const { data: submission, error: submissionError } = await supabase
      .from('blog_distribution_submissions')
      .insert({
        client_id: user.id,
        submission_number: submissionNumberData,
        company_name,
        distribution_type,
        content_type,
        place_url,
        daily_count,
        total_count,
        total_points,
        keywords: validKeywords,
        notes,
        account_id: account_id || null,
        charge_count: charge_count || null,
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
    const distributionTypeLabels: Record<string, string> = {
      'reviewer': '리뷰어 배포',
      'video': '영상 배포',
      'automation': '자동화 배포',
    };

    await supabase.from('point_transactions').insert({
      client_id: user.id,
      transaction_type: 'deduct',
      amount: -total_points,
      balance_after: newBalance,
      reference_type: 'blog_submission',
      reference_id: submission.id,
      description: `블로그 배포 접수 (${company_name} - ${distributionTypeLabels[distribution_type] || distribution_type})`,
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
