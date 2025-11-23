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

    // Content-Type에 따라 다르게 처리
    const contentType = request.headers.get('content-type') || '';
    let imageFile: File | null = null;
    let scriptText: string | null = null;
    let imageUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;

    if (contentType.includes('application/json')) {
      // JSON 요청 처리 (클라이언트가 이미 업로드한 경우)
      const body = await request.json();
      imageUrl = body.image_url || null;
      fileName = body.file_name || null;
      fileSize = body.file_size || null;
      scriptText = body.script_text || null;

      if (!imageUrl && !scriptText) {
        return NextResponse.json(
          { error: '수정할 내용이 없습니다.' },
          { status: 400 }
        );
      }
    } else {
      // FormData 파싱 (파일 직접 업로드)
      const formData = await request.formData();
      imageFile = formData.get('image') as File | null;
      scriptText = formData.get('script_text') as string | null;

      // 최소한 하나는 있어야 함
      if (!imageFile && !scriptText) {
        return NextResponse.json(
          { error: '수정할 내용이 없습니다.' },
          { status: 400 }
        );
      }
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

    // 기존 값으로 초기화 (JSON 요청이 아닌 경우에만)
    if (!imageUrl) {
      imageUrl = existingItem.image_url;
      fileName = existingItem.file_name;
      fileSize = existingItem.file_size;
    }

    // 이미지 업로드 처리 (FormData로 파일이 직접 전송된 경우)
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

    // 이미지 관련 필드 업데이트
    if (imageUrl && imageUrl !== existingItem.image_url) {
      updateData.image_url = imageUrl;
    }
    if (fileName && fileName !== existingItem.file_name) {
      updateData.file_name = fileName;
    }
    if (fileSize !== null && fileSize !== existingItem.file_size) {
      updateData.file_size = fileSize;
    }

    // 스크립트 텍스트 업데이트
    if (scriptText !== null && scriptText !== undefined) {
      updateData.script_text = scriptText;
    }

    // 업데이트할 내용이 없으면 에러
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
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
