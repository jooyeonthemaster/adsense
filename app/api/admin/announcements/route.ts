import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET: 공지사항 목록 조회
export async function GET(request: Request) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const targetAudience = searchParams.get('target_audience');

    // 쿼리 빌더
    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    // 필터 적용
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (targetAudience) {
      query = query.eq('target_audience', targetAudience);
    }

    const { data: announcements, error } = await query;

    if (error) {
      console.error('공지사항 조회 오류:', error);
      return NextResponse.json({ error: '공지사항을 불러오는데 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// POST: 공지사항 생성
export async function POST(request: Request) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();

    const body = await request.json();
    const { title, content, priority, target_audience, expires_at } = body;

    // 유효성 검사
    if (!title || !content || !target_audience) {
      return NextResponse.json(
        { error: '제목, 내용, 대상 관객은 필수입니다' },
        { status: 400 }
      );
    }

    // 공지사항 생성
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        priority: priority || 'normal',
        target_audience,
        expires_at: expires_at || null,
        created_by: user.id,
        is_active: true
      })
      .select('*')
      .single();

    if (error) {
      console.error('공지사항 생성 오류:', error);
      return NextResponse.json({ error: '공지사항 생성에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// PUT: 공지사항 수정
export async function PUT(request: Request) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();

    const body = await request.json();
    const { id, title, content, priority, target_audience, is_active, expires_at } = body;

    if (!id) {
      return NextResponse.json({ error: '공지사항 ID가 필요합니다' }, { status: 400 });
    }

    // 수정할 데이터 준비
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (target_audience !== undefined) updateData.target_audience = target_audience;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    // 공지사항 수정
    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('공지사항 수정 오류:', error);
      return NextResponse.json({ error: '공지사항 수정에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// DELETE: 공지사항 삭제
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth(['admin']);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '공지사항 ID가 필요합니다' }, { status: 400 });
    }

    // 공지사항 삭제
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('공지사항 삭제 오류:', error);
      return NextResponse.json({ error: '공지사항 삭제에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ message: '공지사항이 삭제되었습니다' });
  } catch (error) {
    console.error('서버 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

