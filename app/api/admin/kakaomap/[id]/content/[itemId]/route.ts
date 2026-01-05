import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

// PATCH: 콘텐츠 아이템 수정 (이미지 및 원고)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const { id: submissionId, itemId } = await context.params;
    const supabase = await createClient();

    // FormData 파싱
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const scriptText = formData.get('script_text') as string | null;

    // 최소한 하나는 있어야 함
    if (!imageFile && !scriptText) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
    }

    // 콘텐츠 아이템 존재 확인
    const { data: existingItem, error: fetchError } = await supabase
      .from('kakaomap_content_items')
      .select('*')
      .eq('id', itemId)
      .eq('submission_id', submissionId)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { error: '콘텐츠를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let imageUrl = existingItem.image_url;
    let fileName = existingItem.file_name;
    let fileSize = existingItem.file_size;

    // 이미지 업로드 처리
    if (imageFile) {
      // 파일 크기 체크 (10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
          { status: 400 }
        );
      }

      // Supabase Storage에 업로드
      const fileExt = imageFile.name.split('.').pop();
      const timestamp = Date.now();
      const uniqueFileName = `${submissionId}/${itemId}_${timestamp}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(uniqueFileName, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json(
          { error: '이미지 업로드 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // Public URL 생성
      const { data: publicUrlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(uniqueFileName);

      imageUrl = publicUrlData.publicUrl;
      fileName = imageFile.name;
      fileSize = imageFile.size;

      // 기존 이미지 삭제 (있으면)
      if (existingItem.image_url) {
        const oldPath = existingItem.image_url.split('/').slice(-2).join('/');
        await supabase.storage.from('submissions').remove([oldPath]);
      }
    }

    // DB 업데이트
    const updateData: any = {};

    if (imageUrl !== existingItem.image_url) {
      updateData.image_url = imageUrl;
      updateData.file_name = fileName;
      updateData.file_size = fileSize;
    }

    if (scriptText !== null && scriptText !== undefined) {
      updateData.script_text = scriptText;
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('kakaomap_content_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating content item:', updateError);
      return NextResponse.json(
        { error: '콘텐츠 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '콘텐츠가 성공적으로 수정되었습니다.',
      content_item: updatedItem,
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/kakaomap/[id]/content/[itemId]:', error);
    return NextResponse.json(
      { error: '콘텐츠 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
