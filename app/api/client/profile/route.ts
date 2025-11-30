import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

// GET - 현재 클라이언트 프로필 정보 조회
export async function GET() {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        id,
        username,
        company_name,
        contact_person,
        phone,
        email,
        points,
        pending_charge_requests_count,
        business_license_url,
        business_license_name,
        business_number,
        representative_name,
        business_address,
        tax_email,
        profile_updated_at,
        created_at
      `)
      .eq('id', user.id)
      .single();

    if (error || !client) {
      console.error('프로필 조회 오류:', error);
      return NextResponse.json(
        { error: '프로필 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error in GET /api/client/profile:', error);
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT - 프로필 정보 수정
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);
    const supabase = await createClient();

    const body = await request.json();
    const {
      company_name,
      contact_person,
      phone,
      email,
      business_license_url,
      business_license_name,
      business_number,
      representative_name,
      business_address,
      tax_email,
    } = body;

    const updateData: Record<string, unknown> = {
      profile_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 선택적 필드 업데이트
    if (company_name !== undefined) updateData.company_name = company_name;
    if (contact_person !== undefined) updateData.contact_person = contact_person;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (business_license_url !== undefined) updateData.business_license_url = business_license_url;
    if (business_license_name !== undefined) updateData.business_license_name = business_license_name;
    if (business_number !== undefined) updateData.business_number = business_number;
    if (representative_name !== undefined) updateData.representative_name = representative_name;
    if (business_address !== undefined) updateData.business_address = business_address;
    if (tax_email !== undefined) updateData.tax_email = tax_email;

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('프로필 수정 오류:', error);
      return NextResponse.json(
        { error: '프로필 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '프로필이 수정되었습니다',
      client
    });
  } catch (error) {
    console.error('Error in PUT /api/client/profile:', error);
    return NextResponse.json(
      { error: '프로필 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
