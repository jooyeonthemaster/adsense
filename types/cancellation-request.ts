/**
 * 중단 요청 타입 정의
 * AS 요청과 별도로 관리되는 환불 요청 시스템
 */

export type CancellationRequestStatus = 'pending' | 'approved' | 'rejected';

export type SubmissionType = 'place' | 'receipt' | 'kakaomap' | 'blog' | 'cafe';

export interface CancellationRequest {
  id: string;
  client_id: string;
  submission_type: SubmissionType;
  submission_id: string;
  reason?: string;

  // 진행 상황 스냅샷
  total_count: number;
  completed_count: number;
  progress_rate: number;

  // 비용 정보
  total_points: number;
  calculated_refund: number;
  final_refund?: number;

  // 상태
  status: CancellationRequestStatus;
  admin_response?: string;
  processed_by?: string;
  processed_at?: string;

  created_at: string;
  updated_at: string;

  // 조인된 데이터
  clients?: {
    company_name: string;
    user_id?: string;
  };
  business_name?: string; // submission에서 가져온 업체명
}

export interface CancellationRequestWithDetails extends CancellationRequest {
  // 추가 표시용 데이터
  product_label?: string;
  submission_number?: string;
}

// API 요청/응답 타입
export interface CreateCancellationRequestBody {
  submission_type: SubmissionType;
  submission_id: string;
  reason?: string;
}

export interface CreateCancellationRequestResponse {
  success: boolean;
  cancellationRequest: CancellationRequest;
}

export interface ProcessCancellationRequestBody {
  status: 'approved' | 'rejected';
  final_refund?: number;
  admin_response?: string;
}

export interface ProcessCancellationRequestResponse {
  success: boolean;
  cancellationRequest: CancellationRequest;
  refund_amount?: number;
}

// 통계
export interface CancellationRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  total_refunded: number;
}
