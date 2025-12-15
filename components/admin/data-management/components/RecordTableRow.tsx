'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ParsedRecord, ProductType } from '../types';
import { REVIEW_PRODUCT_TYPES, BLOG_PRODUCT_TYPES } from '../constants';

interface RecordTableRowProps {
  record: ParsedRecord;
  productType: ProductType;
}

// 텍스트 truncate 컴포넌트
function TruncatedText({
  text,
  maxLength = 30,
  className = '',
}: {
  text?: string;
  maxLength?: number;
  className?: string;
}) {
  if (!text) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  const truncated = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

  return (
    <span className={`text-xs text-blue-600 truncate block ${className}`} title={text}>
      {truncated}
    </span>
  );
}

// 링크 컴포넌트
function LinkCell({ url, maxLength = 25 }: { url?: string; maxLength?: number }) {
  if (!url) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:underline truncate block"
      title={url}
    >
      {url.slice(0, maxLength)}...
    </a>
  );
}

// 상태 배지 컴포넌트
function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  return <Badge variant={status === '승인됨' ? 'default' : 'secondary'}>{status}</Badge>;
}

// 리뷰 타입 셀 (K맵, 방문자 리뷰)
function ReviewCells({ record }: { record: ParsedRecord }) {
  return (
    <>
      <TableCell className="max-w-[200px]">
        <TruncatedText text={record.scriptText} />
      </TableCell>
      <TableCell>{record.reviewRegisteredDate}</TableCell>
      <TableCell>{record.receiptDate}</TableCell>
      <TableCell>
        <StatusBadge status={record.reviewStatus} />
      </TableCell>
      <TableCell className="max-w-[150px]">
        <LinkCell url={record.reviewLink} />
      </TableCell>
      <TableCell className="font-mono text-xs">
        {record.reviewId || <span className="text-gray-400">-</span>}
      </TableCell>
    </>
  );
}

// 블로그 배포 타입 셀
function BlogCells({ record }: { record: ParsedRecord }) {
  return (
    <>
      <TableCell className="max-w-[200px]">
        <TruncatedText text={record.blogTitle} />
      </TableCell>
      <TableCell>{record.publishedDate}</TableCell>
      <TableCell>
        <StatusBadge status={record.blogStatus} />
      </TableCell>
      <TableCell className="max-w-[150px]">
        <LinkCell url={record.blogUrl} />
      </TableCell>
      <TableCell className="font-mono text-xs">
        {record.blogId || <span className="text-gray-400">-</span>}
      </TableCell>
    </>
  );
}

// 카페 침투 타입 셀
function CafeCells({ record }: { record: ParsedRecord }) {
  return (
    <>
      <TableCell className="max-w-[200px]">
        <TruncatedText text={record.cafePostTitle} />
      </TableCell>
      <TableCell>{record.cafePublishedDate}</TableCell>
      <TableCell>
        <StatusBadge status={record.cafeStatus} />
      </TableCell>
      <TableCell className="max-w-[150px]">
        <LinkCell url={record.cafePostUrl} />
      </TableCell>
      <TableCell className="font-mono text-xs">
        {record.cafeWriterId || <span className="text-gray-400">-</span>}
      </TableCell>
      <TableCell className="text-xs">
        {record.cafeName || <span className="text-gray-400">-</span>}
      </TableCell>
    </>
  );
}

// 기본 타입 셀 (fallback)
function DefaultCells({ record }: { record: ParsedRecord }) {
  return (
    <>
      <TableCell>{record.date}</TableCell>
      <TableCell className="text-right font-medium">{record.count.toLocaleString()}</TableCell>
      <TableCell className="max-w-[200px] truncate">{record.notes}</TableCell>
    </>
  );
}

// 타입별 데이터 셀 렌더링
function DataCells({
  record,
  productType,
}: {
  record: ParsedRecord;
  productType: ProductType;
}) {
  if (REVIEW_PRODUCT_TYPES.includes(productType)) {
    return <ReviewCells record={record} />;
  }

  if (BLOG_PRODUCT_TYPES.includes(productType)) {
    return <BlogCells record={record} />;
  }

  if (productType === 'cafe') {
    return <CafeCells record={record} />;
  }

  return <DefaultCells record={record} />;
}

export function RecordTableRow({ record, productType }: RecordTableRowProps) {
  return (
    <TableRow className={!record.isValid ? 'bg-red-50' : ''}>
      <TableCell className="text-muted-foreground">{record.row}</TableCell>
      <TableCell>
        {record.isValid ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
      </TableCell>
      <TableCell className="font-mono text-sm">{record.submissionNumber}</TableCell>
      <TableCell>{record.companyName}</TableCell>
      <DataCells record={record} productType={productType} />
      <TableCell>
        {record.errorMessage && (
          <span className={`text-xs ${record.isValid ? 'text-yellow-600' : 'text-red-600'}`}>
            {record.errorMessage}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}
