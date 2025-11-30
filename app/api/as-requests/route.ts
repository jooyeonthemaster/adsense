import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const body = await request.json();
    const {
      submission_type,
      submission_id,
      expected_count,
      actual_count,
      missing_rate,
      description,
    } = body;

    // Validation
    if (!submission_type || !submission_id || !expected_count || !actual_count || !description) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (missing_rate < 20) {
      return NextResponse.json(
        { error: 'AS 신청은 미달률 20% 이상일 때만 가능합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create AS request
    const { data: asRequest, error: asError } = await supabase
      .from('as_requests')
      .insert({
        client_id: user.id,
        submission_type,
        submission_id,
        expected_count,
        actual_count,
        missing_rate,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (asError) {
      console.error('Error creating AS request:', asError);
      return NextResponse.json(
        { error: 'AS 신청 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      asRequest,
    });
  } catch (error) {
    console.error('Error in POST /api/as-requests:', error);
    return NextResponse.json(
      { error: 'AS 신청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['admin', 'client']);
    const supabase = await createClient();

    let query = supabase
      .from('as_requests')
      .select('*, clients(company_name)')
      .order('created_at', { ascending: false });

    // If client, only show their requests
    if (user.type === 'client') {
      query = query.eq('client_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching AS requests:', error);
      return NextResponse.json(
        { error: 'AS 요청 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 각 AS 요청에 대해 submission의 업체명(플레이스명) 가져오기
    const asRequestsWithBusinessName = await Promise.all(
      (data || []).map(async (asRequest) => {
        let businessName = null;
        let placeName = null;

        try {
          // submission_type에 따라 해당 테이블에서 업체명 조회
          const tableMap: Record<string, string> = {
            place: 'place_submissions',
            receipt: 'receipt_review_submissions',
            kakaomap: 'kakaomap_review_submissions',
            blog: 'blog_distribution_submissions',
            cafe: 'cafe_marketing_submissions',
            reward: 'place_submissions', // 리워드는 place_submissions 사용
          };

          const tableName = tableMap[asRequest.submission_type];
          if (tableName) {
            const { data: submission } = await supabase
              .from(tableName)
              .select('company_name')
              .eq('id', asRequest.submission_id)
              .single();

            if (submission) {
              businessName = submission.company_name || null;
            }
          }
        } catch (e) {
          console.error('업체명 조회 실패:', e);
        }

        return {
          ...asRequest,
          business_name: businessName,
          place_name: placeName,
        };
      })
    );

    return NextResponse.json({ asRequests: asRequestsWithBusinessName });
  } catch (error) {
    console.error('Error in GET /api/as-requests:', error);
    return NextResponse.json(
      { error: 'AS 요청 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
