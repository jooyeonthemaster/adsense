'use client';

interface GuideImage {
  url: string;
  mobile_url?: string;
  link?: string;
  alt?: string;
}

interface GuideImageDisplayProps {
  images: GuideImage[];
  layout: string;
}

export function GuideImageDisplay({ images, layout }: GuideImageDisplayProps) {
  if (!images || images.length === 0) return null;

  const renderImage = (img: GuideImage, idx: number, className?: string) => {
    const ImageWrapper = img.link ? 'a' : 'div';
    const wrapperProps = img.link
      ? {
          href: img.link,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'block hover:opacity-80 transition-opacity cursor-pointer'
        }
      : { className: 'block' };

    return (
      <div key={idx} className={className}>
        <ImageWrapper {...wrapperProps}>
          <picture>
            {img.mobile_url && (
              <source media="(max-width: 768px)" srcSet={img.mobile_url} />
            )}
            <img
              src={img.url}
              alt={img.alt || `이미지 ${idx + 1}`}
              className="w-full h-auto rounded-lg shadow-sm"
            />
          </picture>
        </ImageWrapper>
        {img.alt && (
          <p className="text-xs text-center mt-2 text-muted-foreground">{img.alt}</p>
        )}
      </div>
    );
  };

  // 배너형: 전체 너비 (1장)
  if (layout === 'banner') {
    return (
      <div className="mb-6 -mx-4 md:mx-0">
        {renderImage(images[0], 0, 'w-full')}
      </div>
    );
  }

  // 갤러리형: 가로 스크롤
  if (layout === 'gallery') {
    return (
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-4 pb-2">
          {images.map((img, idx) => renderImage(img, idx, 'w-80 flex-shrink-0'))}
        </div>
      </div>
    );
  }

  // 그리드형: 2-3열
  if (layout === 'grid') {
    return (
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, idx) => renderImage(img, idx))}
      </div>
    );
  }

  // 인라인형: 텍스트와 함께
  if (layout === 'inline') {
    return (
      <div className="mb-4 flex flex-wrap gap-3">
        {images.map((img, idx) => renderImage(img, idx, 'w-32 md:w-40'))}
      </div>
    );
  }

  return null;
}






