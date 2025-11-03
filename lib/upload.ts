import { createClient } from '@/utils/supabase/client';

const BUCKET_NAME = 'submissions';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(file: File, folder: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
  }

  const supabase = createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error('파일 업로드에 실패했습니다.');
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function uploadMultipleFiles(
  files: File[],
  folder: string
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadFile(file, folder));
  return Promise.all(uploadPromises);
}

export async function deleteFile(url: string): Promise<void> {
  const supabase = createClient();

  // Extract file path from URL
  const path = url.split(`/${BUCKET_NAME}/`)[1];

  if (!path) {
    throw new Error('Invalid file URL');
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error('파일 삭제에 실패했습니다.');
  }
}
