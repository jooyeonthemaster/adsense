import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/service';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(['admin']);

    const { submissionNumbers } = await request.json();

    if (!submissionNumbers || !Array.isArray(submissionNumbers)) {
      return NextResponse.json(
        { error: '접수번호 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const submissions: Array<{
      submission_number: string;
      id: string;
      company_name: string;
      product_type: string;
    }> = [];

    // 접수번호 prefix로 상품 타입 분류
    const prefixMap: Record<string, { table: string; type: string }> = {
      PL: { table: 'place_submissions', type: 'place' },
      RR: { table: 'receipt_review_submissions', type: 'receipt' },
      KM: { table: 'kakaomap_review_submissions', type: 'kakaomap' },
      BD: { table: 'blog_distribution_submissions', type: 'blog' },
      EX: { table: 'experience_submissions', type: 'experience' },
      CM: { table: 'cafe_marketing_submissions', type: 'cafe' },
    };

    // prefix별로 그룹화
    const groupedNumbers: Record<string, string[]> = {};
    for (const num of submissionNumbers) {
      const prefix = num.split('-')[0];
      if (!groupedNumbers[prefix]) {
        groupedNumbers[prefix] = [];
      }
      groupedNumbers[prefix].push(num);
    }

    // 각 테이블에서 조회
    for (const [prefix, numbers] of Object.entries(groupedNumbers)) {
      const config = prefixMap[prefix];
      if (!config) continue;

      const { data, error } = await supabase
        .from(config.table)
        .select('id, submission_number, company_name, status')
        .in('submission_number', numbers);

      if (error) {
        console.error(`${config.table} 조회 오류:`, error);
        continue;
      }

      if (data) {
        for (const item of data) {
          submissions.push({
            submission_number: item.submission_number,
            id: item.id,
            company_name: item.company_name,
            product_type: config.type,
          });
        }
      }
    }

    return NextResponse.json({
      submissions,
      total: submissions.length,
    });
  } catch (error) {
    console.error('접수번호 검증 오류:', error);
    return NextResponse.json(
      { error: '접수번호 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
