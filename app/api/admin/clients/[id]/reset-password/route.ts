import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;

    const body = await request.json();
    const { newPassword } = body;

    // 비밀번호 검증
    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json(
        { error: '비밀번호는 최소 4자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 거래처 존재 확인
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, username')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: '거래처를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: '비밀번호 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newPassword, // 평문 비밀번호 반환 (한 번만 표시)
      message: '비밀번호가 성공적으로 재설정되었습니다.',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/clients/[id]/reset-password:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
