import imageCompression from 'browser-image-compression';

interface ResizeOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

const DEFAULT_OPTIONS: ResizeOptions = {
  maxSizeMB: 1, // 최대 1MB
  maxWidthOrHeight: 1920, // 최대 가로/세로 1920px
  useWebWorker: true,
  quality: 0.8, // 80% 품질
};

/**
 * 단일 이미지 리사이징
 * @param file 원본 이미지 파일
 * @param options 리사이징 옵션 (선택사항)
 * @returns 리사이징된 이미지 파일
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<File> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    // 이미지 파일이 아니면 원본 반환
    if (!file.type.startsWith('image/')) {
      console.warn('Not an image file:', file.name);
      return file;
    }

    // 이미 작은 파일이면 리사이징 건너뛰기
    if (file.size <= (mergedOptions.maxSizeMB! * 1024 * 1024)) {
      console.log('File already small enough:', file.name);
      return file;
    }

    console.log('Resizing image:', file.name, 'Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

    const compressedFile = await imageCompression(file, mergedOptions);

    console.log('Resized image:', compressedFile.name, 'New size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

    return compressedFile;
  } catch (error) {
    console.error('Error resizing image:', error);
    // 에러 발생 시 원본 반환
    return file;
  }
}

/**
 * 여러 이미지 일괄 리사이징
 * @param files 원본 이미지 파일 배열
 * @param options 리사이징 옵션 (선택사항)
 * @param onProgress 진행 상태 콜백 (선택사항)
 * @returns 리사이징된 이미지 파일 배열
 */
export async function resizeImages(
  files: File[],
  options: ResizeOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<File[]> {
  const resizedFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const resized = await resizeImage(files[i], options);
    resizedFiles.push(resized);

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return resizedFiles;
}

/**
 * 이미지 미리보기 URL 생성
 * @param file 이미지 파일
 * @returns 미리보기 URL
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 이미지 미리보기 URL 해제
 * @param url 미리보기 URL
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
