import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// GET: 전체 세금계산서 발행 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('tax_invoice_requests')
      .select(`
        *,
        clients (
          id,
          company_name,
          username,
          contact_person,
          phone,
          email,
          tax_email,
          business_license_url
        ),
        point_transactions (
          description,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tax invoice requests:', error);
      return NextResponse.json(
        { error: '세금계산서 발행 요청 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 대기 중인 요청 수
    const { count: pendingCount } = await supabase
      .from('tax_invoice_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return NextResponse.json({
      success: true,
      requests: data || [],
      pendingCount: pendingCount || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/tax-invoice-requests:', error);
    return NextResponse.json(
      { error: '세금계산서 발행 요청을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 세금계산서 발행 요청 상태 변경
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAuth(['admin']);
    const supabase = await createClient();
    const body = await request.json();

    const { id, status, reject_reason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (!['completed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }

    if (status === 'rejected' && !reject_reason) {
      return NextResponse.json(
        { error: '거부 사유를 입력해주세요.' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      completed_at: new Date().toISOString(),
      completed_by: admin.id,
    };

    if (status === 'rejected') {
      updateData.reject_reason = reject_reason;
    }

    const { data, error } = await supabase
      .from('tax_invoice_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tax invoice request:', error);
      return NextResponse.json(
        { error: '세금계산서 발행 요청 상태 변경 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request: data,
      message: status === 'completed'
        ? '세금계산서 발행이 완료되었습니다.'
        : '세금계산서 발행 요청이 거부되었습니다.',
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/tax-invoice-requests:', error);
    return NextResponse.json(
      { error: '세금계산서 발행 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
