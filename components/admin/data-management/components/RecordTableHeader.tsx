'use client';

import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ProductType } from '../types';
import { REVIEW_PRODUCT_TYPES, BLOG_PRODUCT_TYPES } from '../constants';

interface RecordTableHeaderProps {
  productType: ProductType;
}

// 리뷰 타입 헤더 (K맵, 방문자 리뷰)
function ReviewHeaders() {
  return (
    <>
      <TableHead>리뷰원고</TableHead>
      <TableHead>리뷰등록날짜</TableHead>
      <TableHead>영수증날짜</TableHead>
      <TableHead>상태</TableHead>
      <TableHead>리뷰링크</TableHead>
      <TableHead>리뷰아이디</TableHead>
    </>
  );
}

// 블로그 배포 타입 헤더
function BlogHeaders() {
  return (
    <>
      <TableHead>작성제목</TableHead>
      <TableHead>발행일</TableHead>
      <TableHead>상태</TableHead>
      <TableHead>블로그링크</TableHead>
      <TableHead>블로그아이디</TableHead>
    </>
  );
}

// 카페 침투 타입 헤더
function CafeHeaders() {
  return (
    <>
      <TableHead>작성제목</TableHead>
      <TableHead>발행일</TableHead>
      <TableHead>상태</TableHead>
      <TableHead>리뷰링크</TableHead>
      <TableHead>작성아이디</TableHead>
      <TableHead>카페명</TableHead>
    </>
  );
}

// 기본 타입 헤더 (fallback)
function DefaultHeaders() {
  return (
    <>
      <TableHead>날짜</TableHead>
      <TableHead className="text-right">완료수</TableHead>
      <TableHead>메모</TableHead>
    </>
  );
}

// 타입별 헤더 렌더링
function TypeSpecificHeaders({ productType }: { productType: ProductType }) {
  if (REVIEW_PRODUCT_TYPES.includes(productType)) {
    return <ReviewHeaders />;
  }

  if (BLOG_PRODUCT_TYPES.includes(productType)) {
    return <BlogHeaders />;
  }

  if (productType === 'cafe') {
    return <CafeHeaders />;
  }

  return <DefaultHeaders />;
}

export function RecordTableHeader({ productType }: RecordTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">행</TableHead>
        <TableHead className="w-12">검증</TableHead>
        <TableHead>접수번호</TableHead>
        <TableHead>업체명</TableHead>
        <TypeSpecificHeaders productType={productType} />
        <TableHead>비고</TableHead>
      </TableRow>
    </TableHeader>
  );
}
