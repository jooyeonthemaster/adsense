import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { hashPassword } from '@/lib/auth';

// 임시 비밀번호 재설정 API (개발용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, newPassword } = body;

    if (!username || !newPassword) {
      return NextResponse.json(
        { error: '사용자명과 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update admin password
    const { data, error } = await supabase
      .from('admins')
      .update({ password: hashedPassword })
      .eq('username', username)
      .select()
      .single();

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { error: '비밀번호 업데이트 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `비밀번호가 성공적으로 재설정되었습니다.`,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/reset-password:', error);
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류 발생' },
      { status: 500 }
    );
  }
}
