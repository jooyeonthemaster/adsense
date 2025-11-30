-- 알림 시스템 설정 확인

-- 1. notifications 테이블 존재 확인
SELECT 'notifications 테이블' AS check_item, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
       THEN '✅ 존재' ELSE '❌ 없음' END AS status;

-- 2. 알림 트리거 확인
SELECT 'points_charged_trigger' AS check_item,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'points_charged_trigger')
       THEN '✅ 존재' ELSE '❌ 없음' END AS status;

-- 3. 최근 point_transactions 확인 (최근 5건)
SELECT 'point_transactions (최근 5건)' AS info, 
       id, client_id, transaction_type, amount, created_at 
FROM point_transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. notifications 테이블 데이터 확인 (최근 10건)
SELECT 'notifications (최근 10건)' AS info,
       id, type, title, message, recipient_role, recipient_id, read, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- 5. 포인트 충전 알림 확인
SELECT 'points_charged 알림' AS info,
       COUNT(*) as count
FROM notifications
WHERE type = 'points_charged';






