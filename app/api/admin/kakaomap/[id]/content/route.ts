import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const { id } = await params;
    const body = await request.json();
    const { image_url, script_text, file_name, file_size, upload_order } = body;

    if (!image_url && !script_text) {
      return NextResponse.json(
        { error: '이미지 또는 스크립트 중 하나는 필수입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify submission exists
    const { data: submission, error: fetchError } = await supabase
      .from('kakaomap_review_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: '접수 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if we've reached total_count limit
    const { count: existingCount } = await supabase
      .from('kakaomap_content_items')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', id);

    if (existingCount && existingCount >= submission.total_count) {
      return NextResponse.json(
        { error: `최대 ${submission.total_count}개까지만 업로드 가능합니다.` },
        { status: 400 }
      );
    }

    // Determine next upload_order if not provided
    let nextOrder = upload_order;
    if (!nextOrder) {
      const { data: lastItem } = await supabase
        .from('kakaomap_content_items')
        .select('upload_order')
        .eq('submission_id', id)
        .order('upload_order', { ascending: false })
        .limit(1)
        .single();

      nextOrder = lastItem ? lastItem.upload_order + 1 : 1;
    }

    // Create content item
    const { data: contentItem, error: createError } = await supabase
      .from('kakaomap_content_items')
      .insert({
        submission_id: id,
        image_url,
        script_text,
        file_name,
        file_size,
        upload_order: nextOrder,
        status: 'pending',
        is_published: false, // 배포 전까지는 비공개
        source_type: 'admin_upload', // 관리자 페이지 업로드 (리포트용 아님)
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating content item:', createError);
      return NextResponse.json(
        { error: '콘텐츠 업로드 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Check if this completes the upload (all items uploaded)
    const { count: newCount } = await supabase
      .from('kakaomap_content_items')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', id);

    // If all content items are uploaded, update submission status to 'review'
    if (newCount === submission.total_count) {
      await supabase
        .from('kakaomap_review_submissions')
        .update({ status: 'review' })
        .eq('id', id);

      // Send notification message to client
      const { data: client } = await supabase
        .from('clients')
        .select('company_name')
        .eq('id', submission.client_id)
        .single();

      if (client) {
        // 메시지 추가
        await supabase.from('kakaomap_messages').insert({
          submission_id: id,
          sender_type: 'admin',
          sender_id: user.id,
          sender_name: user.name,
          content: `콘텐츠 ${submission.total_count}개가 모두 업로드되었습니다. 검수를 진행해주세요.`,
          is_read: false,
        });

        // 클라이언트에게 알림 발송
        await supabase.from('notifications').insert({
          recipient_id: submission.client_id,
          recipient_role: 'client',
          type: 'kakaomap_content_uploaded',
          title: '카카오맵 콘텐츠 업로드 완료',
          message: `${client.company_name} 카카오맵 리뷰 콘텐츠 ${submission.total_count}개가 모두 업로드되었습니다. 검수를 진행해주세요.`,
          data: {
            submission_id: id,
            submission_type: 'kakaomap_review_submissions',
            total_count: submission.total_count,
          },
          read: false,
        });
      }
    } else {
      // Update status to waiting_content if not already
      if (submission.status === 'pending') {
        await supabase
          .from('kakaomap_review_submissions')
          .update({ status: 'waiting_content' })
          .eq('id', id);
      }
    }

    revalidatePath('/admin', 'layout');

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 업로드되었습니다.',
      content_item: contentItem,
      uploaded_count: newCount,
      total_count: submission.total_count,
      is_complete: newCount === submission.total_count,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/kakaomap/[id]/content:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const { id } = await params;
    const supabase = await createClient();

    // Get all content items for this submission
    const { data: contentItems, error } = await supabase
      .from('kakaomap_content_items')
      .select('*')
      .eq('submission_id', id)
      .order('upload_order', { ascending: true });

    if (error) {
      console.error('Error fetching content items:', error);
      return NextResponse.json(
        { error: '콘텐츠 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Get submission info
    const { data: submission } = await supabase
      .from('kakaomap_review_submissions')
      .select('total_count, status')
      .eq('id', id)
      .single();

    // 관리자가 조회할 때 클라이언트가 보낸 피드백을 읽음 처리
    await supabase
      .from('kakaomap_content_item_feedbacks')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('submission_id', id)
      .eq('sender_type', 'client')
      .eq('is_read', false);

    return NextResponse.json({
      success: true,
      content_items: contentItems || [],
      total_count: submission?.total_count || 0,
      uploaded_count: contentItems?.length || 0,
      submission_status: submission?.status,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/kakaomap/[id]/content:', error);
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const contentItemId = searchParams.get('item_id');

    if (!contentItemId) {
      return NextResponse.json(
        { error: '삭제할 콘텐츠 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 삭제 전 아이템 상태 확인
    const { data: item, error: fetchError } = await supabase
      .from('kakaomap_content_items')
      .select('review_status')
      .eq('id', contentItemId)
      .eq('submission_id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { error: '콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 승인된 콘텐츠는 삭제 불가
    if (item.review_status === 'approved') {
      return NextResponse.json(
        { error: '승인된 콘텐츠는 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Delete content item
    const { error: deleteError } = await supabase
      .from('kakaomap_content_items')
      .delete()
      .eq('id', contentItemId)
      .eq('submission_id', id);

    if (deleteError) {
      console.error('Error deleting content item:', deleteError);
      return NextResponse.json(
        { error: '삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    revalidatePath('/admin', 'layout');

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/kakaomap/[id]/content:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
