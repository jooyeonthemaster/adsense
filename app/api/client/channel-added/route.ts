import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/service';

// 카카오 채널 추가 완료 저장
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['client']);

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 클라이언트의 kakao_channel_added 필드를 true로 업데이트
    const { error } = await supabase
      .from('clients')
      .update({ kakao_channel_added: true })
      .eq('id', user.id);

    if (error) {
      console.error('채널 추가 상태 저장 에러:', error);
      return NextResponse.json(
        { error: '채널 추가 상태 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '카카오 채널 추가가 완료되었습니다.',
    });
  } catch (error) {
    console.error('채널 추가 API 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
