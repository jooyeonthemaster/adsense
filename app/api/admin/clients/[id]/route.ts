import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;

    const body = await request.json();
    const { company_name, contact_person, phone, email, is_active } = body;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('clients')
      .update({
        company_name,
        contact_person: contact_person || null,
        phone: phone || null,
        email: email || null,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json(
        { error: '거래처 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, client: data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/clients/[id]:', error);
    return NextResponse.json(
      { error: '거래처 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;

    const supabase = await createClient();

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json(
        { error: '거래처 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/clients/[id]:', error);
    return NextResponse.json(
      { error: '거래처 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
