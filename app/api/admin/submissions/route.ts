import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';

/**
 * 전체 접수 내역 API - 완전 재작성 + 최대 성능 최적화 버전
 *
 * 성능 최적화:
 * 1. 일괄 조회 (Batch Query) - 개별 쿼리 제거
 * 2. 모든 쿼리 병렬 실행 (Promise.all) - 순차 실행 제거
 * 3. 최소 필드만 조회 - 불필요한 데이터 전송 최소화
 */
export async function GET() {
  try {
    await requireAuth(['admin']);
    const supabase = await createClient();

    // ===================================================================
    // STEP 1: 모든 기본 submissions 조회 (병렬 실행)
    // ===================================================================
    const [
      { data: placeSubmissions },
      { data: receiptSubmissions },
      { data: kakaomapSubmissions },
      { data: blogSubmissions },
      { data: cafeSubmissions },
      { data: experienceSubmissions },
    ] = await Promise.all([
      supabase.from('place_submissions').select('*, clients(company_name)').order('created_at', { ascending: false }),
      supabase.from('receipt_review_submissions').select('*, clients(company_name)').order('created_at', { ascending: false }),
      supabase.from('kakaomap_review_submissions').select('*, clients(company_name)').order('created_at', { ascending: false }),
      supabase.from('blog_distribution_submissions').select('*, clients(company_name)').order('created_at', { ascending: false }),
      supabase.from('cafe_marketing_submissions').select('*, clients(company_name)').order('created_at', { ascending: false }),
      supabase.from('experience_submissions').select('*, clients(company_name)').order('created_at', { ascending: false }),
    ]);

    // ===================================================================
    // STEP 2: 모든 daily_records와 관련 데이터 조회 (병렬 실행)
    // ===================================================================
    const placeIds = placeSubmissions?.map(s => s.id) || [];
    const receiptIds = receiptSubmissions?.map(s => s.id) || [];
    const kakaomapIds = kakaomapSubmissions?.map(s => s.id) || [];
    const blogIds = blogSubmissions?.map(s => s.id) || [];
    const cafeIds = cafeSubmissions?.map(s => s.id) || [];

    const [
      // Place
      { data: placeDailyRecords },
      // Receipt
      { data: receiptContentItems },
      { data: receiptUnreadMessages },
      { data: receiptRevisionRequests },
      { data: receiptDailyRecords },
      // Kakaomap
      { data: kakaomapContentItems },
      { data: kakaomapUnreadMessages },
      { data: kakaomapRevisionRequests },
      // Blog
      { data: blogDailyRecords },
      // Cafe
      { data: cafeDailyRecords },
    ] = await Promise.all([
      // Place
      placeIds.length > 0
        ? supabase.from('place_submissions_daily_records').select('submission_id, actual_count, date').in('submission_id', placeIds)
        : Promise.resolve({ data: [] }),
      // Receipt
      receiptIds.length > 0
        ? supabase.from('receipt_content_items').select('submission_id').in('submission_id', receiptIds)
        : Promise.resolve({ data: [] }),
      receiptIds.length > 0
        ? supabase.from('receipt_messages').select('submission_id').in('submission_id', receiptIds).eq('sender_type', 'client').eq('is_read', false)
        : Promise.resolve({ data: [] }),
      receiptIds.length > 0
        ? supabase.from('receipt_revision_requests').select('submission_id').in('submission_id', receiptIds).in('status', ['pending', 'in_progress'])
        : Promise.resolve({ data: [] }),
      receiptIds.length > 0
        ? supabase.from('receipt_review_daily_records').select('submission_id, actual_count').in('submission_id', receiptIds)
        : Promise.resolve({ data: [] }),
      // Kakaomap
      kakaomapIds.length > 0
        ? supabase.from('kakaomap_content_items').select('submission_id').in('submission_id', kakaomapIds)
        : Promise.resolve({ data: [] }),
      kakaomapIds.length > 0
        ? supabase.from('kakaomap_messages').select('submission_id').in('submission_id', kakaomapIds).eq('sender_type', 'client').eq('is_read', false)
        : Promise.resolve({ data: [] }),
      kakaomapIds.length > 0
        ? supabase.from('kakaomap_revision_requests').select('submission_id').in('submission_id', kakaomapIds).in('status', ['pending', 'in_progress'])
        : Promise.resolve({ data: [] }),
      // Blog
      blogIds.length > 0
        ? supabase.from('blog_distribution_daily_records').select('submission_id, completed_count').in('submission_id', blogIds)
        : Promise.resolve({ data: [] }),
      // Cafe
      cafeIds.length > 0
        ? supabase.from('cafe_marketing_daily_records').select('submission_id, completed_count').in('submission_id', cafeIds)
        : Promise.resolve({ data: [] }),
    ]);

    // ===================================================================
    // STEP 3: 데이터 매핑 (Map 생성)
    // ===================================================================

    // Place
    const placeProgressMap = new Map<string, { completed: number; currentDay: number }>();
    placeDailyRecords?.forEach((record) => {
      const current = placeProgressMap.get(record.submission_id) || { completed: 0, currentDay: 0 };
      placeProgressMap.set(record.submission_id, {
        completed: current.completed + record.actual_count,
        currentDay: current.currentDay + 1,
      });
    });

    // Receipt
    const receiptContentCountMap = new Map<string, number>();
    receiptContentItems?.forEach(item => {
      receiptContentCountMap.set(item.submission_id, (receiptContentCountMap.get(item.submission_id) || 0) + 1);
    });

    const receiptUnreadCountMap = new Map<string, number>();
    receiptUnreadMessages?.forEach(msg => {
      receiptUnreadCountMap.set(msg.submission_id, (receiptUnreadCountMap.get(msg.submission_id) || 0) + 1);
    });

    const receiptRevisionCountMap = new Map<string, number>();
    receiptRevisionRequests?.forEach(req => {
      receiptRevisionCountMap.set(req.submission_id, (receiptRevisionCountMap.get(req.submission_id) || 0) + 1);
    });

    const receiptActualCountMap = new Map<string, number>();
    receiptDailyRecords?.forEach(record => {
      const current = receiptActualCountMap.get(record.submission_id) || 0;
      receiptActualCountMap.set(record.submission_id, current + record.actual_count);
    });

    // Kakaomap
    const kakaomapContentCountMap = new Map<string, number>();
    kakaomapContentItems?.forEach(item => {
      kakaomapContentCountMap.set(item.submission_id, (kakaomapContentCountMap.get(item.submission_id) || 0) + 1);
    });

    const kakaomapUnreadCountMap = new Map<string, number>();
    kakaomapUnreadMessages?.forEach(msg => {
      kakaomapUnreadCountMap.set(msg.submission_id, (kakaomapUnreadCountMap.get(msg.submission_id) || 0) + 1);
    });

    const kakaomapRevisionCountMap = new Map<string, number>();
    kakaomapRevisionRequests?.forEach(req => {
      kakaomapRevisionCountMap.set(req.submission_id, (kakaomapRevisionCountMap.get(req.submission_id) || 0) + 1);
    });

    // Blog
    const blogCompletedMap = new Map<string, number>();
    blogDailyRecords?.forEach((record) => {
      const currentCount = blogCompletedMap.get(record.submission_id) || 0;
      blogCompletedMap.set(record.submission_id, currentCount + record.completed_count);
    });

    // Cafe
    const cafeCompletedMap = new Map<string, number>();
    cafeDailyRecords?.forEach((record) => {
      const currentCount = cafeCompletedMap.get(record.submission_id) || 0;
      cafeCompletedMap.set(record.submission_id, currentCount + record.completed_count);
    });

    // ===================================================================
    // STEP 4: 진행률 계산 및 최종 데이터 생성
    // ===================================================================

    const placeWithProgress = (placeSubmissions || []).map((sub) => {
      const progress = placeProgressMap.get(sub.id) || { completed: 0, currentDay: 0 };
      const totalExpected = sub.daily_count * sub.total_days;
      const progressPercentage = totalExpected > 0 ? Math.round((progress.completed / totalExpected) * 100) : 0;

      return {
        ...sub,
        type: 'place' as const,
        completed_count: progress.completed,
        current_day: progress.currentDay,
        progress_percentage: progressPercentage,
      };
    });

    const receiptWithDetails = (receiptSubmissions || []).map((sub) => {
      const actualCountTotal = receiptActualCountMap.get(sub.id) || 0;
      const progressPercentage = sub.total_count > 0 ? Math.round((actualCountTotal / sub.total_count) * 100) : 0;

      return {
        ...sub,
        type: 'receipt' as const,
        content_items_count: receiptContentCountMap.get(sub.id) || 0,
        unread_messages_count: receiptUnreadCountMap.get(sub.id) || 0,
        pending_revision_count: receiptRevisionCountMap.get(sub.id) || 0,
        actual_count_total: actualCountTotal,
        progress_percentage: progressPercentage,
      };
    });

    const kakaomapWithDetails = (kakaomapSubmissions || []).map((sub) => {
      const contentCount = kakaomapContentCountMap.get(sub.id) || 0;
      const progressPercentage = sub.total_count > 0 ? Math.round((contentCount / sub.total_count) * 100) : 0;

      return {
        ...sub,
        type: 'kakaomap' as const,
        content_items_count: contentCount,
        unread_messages_count: kakaomapUnreadCountMap.get(sub.id) || 0,
        pending_revision_count: kakaomapRevisionCountMap.get(sub.id) || 0,
        progress_percentage: progressPercentage,
      };
    });

    const blogWithProgress = (blogSubmissions || []).map((sub) => {
      const completedCount = blogCompletedMap.get(sub.id) || 0;
      const progressPercentage = sub.total_count > 0 ? Math.round((completedCount / sub.total_count) * 100) : 0;

      return {
        ...sub,
        type: 'blog' as const,
        completed_count: completedCount,
        progress_percentage: progressPercentage,
      };
    });

    const cafeWithProgress = (cafeSubmissions || []).map((sub) => {
      const completedCount = cafeCompletedMap.get(sub.id) || 0;
      const progressPercentage = sub.total_count > 0 ? Math.round((completedCount / sub.total_count) * 100) : 0;

      return {
        ...sub,
        type: 'cafe' as const,
        completed_count: completedCount,
        progress_percentage: progressPercentage,
      };
    });

    const experienceWithProgress = (experienceSubmissions || []).map((sub) => {
      let progressSteps = 0;
      if (sub.bloggers_registered) progressSteps++;
      if (sub.bloggers_selected) progressSteps++;
      if (sub.schedule_confirmed) progressSteps++;
      if (sub.client_confirmed) progressSteps++;
      if (sub.all_published) progressSteps++;
      if (sub.campaign_completed) progressSteps++;

      const progressPercentage = Math.round((progressSteps / 6) * 100);

      return {
        ...sub,
        type: 'experience' as const,
        progress_percentage: progressPercentage,
      };
    });

    // ===================================================================
    // STEP 5: 통합 및 정렬
    // ===================================================================
    const allSubmissions = [
      ...placeWithProgress,
      ...receiptWithDetails,
      ...kakaomapWithDetails,
      ...blogWithProgress,
      ...cafeWithProgress,
      ...experienceWithProgress,
    ];

    allSubmissions.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log('[전체 접수 API v4 최대 최적화] 총 submissions:', allSubmissions.length, {
      place: placeWithProgress.length,
      receipt: receiptWithDetails.length,
      kakaomap: kakaomapWithDetails.length,
      blog: blogWithProgress.length,
      cafe: cafeWithProgress.length,
      experience: experienceWithProgress.length,
    });

    return NextResponse.json({ submissions: allSubmissions });
  } catch (error) {
    console.error('Error in GET /api/admin/submissions:', error);
    return NextResponse.json(
      { error: '접수 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
