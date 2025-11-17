import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client', 'admin']);
    const { id } = await params;
    const supabase = await createClient();

    // Verify submission access
    if (user.type === 'client') {
      const { data: submission, error: fetchError } = await supabase
        .from('kakaomap_review_submissions')
        .select('id')
        .eq('id', id)
        .eq('client_id', user.id)
        .single();

      if (fetchError || !submission) {
        return NextResponse.json(
          { error: '접수 내역을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // Get all messages for this submission
    const { data: messages, error } = await supabase
      .from('kakaomap_messages')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: '메시지 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Mark messages as read (messages sent to this user)
    if (user.type === 'client') {
      await supabase
        .from('kakaomap_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('submission_id', id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);
    } else if (user.type === 'admin') {
      await supabase
        .from('kakaomap_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('submission_id', id)
        .eq('sender_type', 'client')
        .eq('is_read', false);
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    });
  } catch (error) {
    console.error('Error in GET /api/submissions/kakaomap/[id]/messages:', error);
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['client', 'admin']);
    const { id } = await params;
    const body = await request.json();
    const { content, attachment_url, attachment_name } = body;

    if (!content) {
      return NextResponse.json(
        { error: '메시지 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify submission access
    if (user.type === 'client') {
      const { data: submission, error: fetchError } = await supabase
        .from('kakaomap_review_submissions')
        .select('id')
        .eq('id', id)
        .eq('client_id', user.id)
        .single();

      if (fetchError || !submission) {
        return NextResponse.json(
          { error: '접수 내역을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    } else {
      // Admin can access any submission
      const { data: submission, error: fetchError } = await supabase
        .from('kakaomap_review_submissions')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !submission) {
        return NextResponse.json(
          { error: '접수 내역을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    // Create message
    const { data: message, error: createError } = await supabase
      .from('kakaomap_messages')
      .insert({
        submission_id: id,
        sender_type: user.type,
        sender_id: user.id,
        sender_name: user.name,
        content,
        attachment_url,
        attachment_name,
        is_read: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating message:', createError);
      return NextResponse.json(
        { error: '메시지 전송 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    revalidatePath('/dashboard', 'layout');

    return NextResponse.json({
      success: true,
      message: '메시지가 전송되었습니다.',
      data: message,
    });
  } catch (error) {
    console.error('Error in POST /api/submissions/kakaomap/[id]/messages:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
