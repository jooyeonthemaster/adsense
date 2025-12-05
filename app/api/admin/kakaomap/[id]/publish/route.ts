import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@/utils/supabase/service';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const { id: submissionId } = await context.params;
    const supabase = await createClient();
    const serviceSupabase = createServiceClient(); // Service role for updates

    // Check if force parameter is provided
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Get submission info
    const { data: submission, error: submissionError } = await supabase
      .from('kakaomap_review_submissions')
      .select('has_photo, photo_ratio, total_count')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: '접수를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get all content items
    const { data: contentItems, error: itemsError } = await supabase
      .from('kakaomap_content_items')
      .select('id, image_url')
      .eq('submission_id', submissionId);

    if (itemsError) {
      return NextResponse.json(
        { error: '콘텐츠 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const totalCount = contentItems?.length || 0;
    const photoCount = contentItems?.filter(item => item.image_url).length || 0;
    const actualPhotoRatio = totalCount > 0 ? Math.round((photoCount / totalCount) * 100) : 0;

    // Check photo ratio if has_photo is true (skip if force=true)
    if (!force && submission.has_photo && actualPhotoRatio < submission.photo_ratio) {
      return NextResponse.json(
        {
          error: 'photo_ratio_insufficient',
          message: `사진 비율이 부족합니다. 필요: ${submission.photo_ratio}%, 현재: ${actualPhotoRatio}%`,
          required_ratio: submission.photo_ratio,
          actual_ratio: actualPhotoRatio,
          total_count: totalCount,
          photo_count: photoCount,
        },
        { status: 400 }
      );
    }

    // Publish only unpublished content items (use service role to bypass RLS)
    // Set updated_at to current time for daily record tracking
    const { error: updateError } = await serviceSupabase
      .from('kakaomap_content_items')
      .update({
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('submission_id', submissionId)
      .eq('is_published', false); // Only update unpublished items

    if (updateError) {
      console.error('Error publishing content items:', updateError);
      return NextResponse.json(
        { error: '배포 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // Count how many items were actually published
    const { count: publishedNowCount } = await serviceSupabase
      .from('kakaomap_content_items')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId)
      .eq('is_published', true);

    // Update submission status to in_progress (use service role)
    await serviceSupabase
      .from('kakaomap_review_submissions')
      .update({ status: 'in_progress' })
      .eq('id', submissionId);

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 배포되었습니다.',
      total_count: totalCount,
      published_count: publishedNowCount || 0,
      photo_count: photoCount,
      actual_ratio: actualPhotoRatio,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/kakaomap/[id]/publish:', error);
    return NextResponse.json(
      { error: '배포 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
