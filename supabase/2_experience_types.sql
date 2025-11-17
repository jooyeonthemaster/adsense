-- 2. 체험단 7건의 타입별 분포
SELECT
    experience_type AS "타입",
    COUNT(*) AS "건수",
    SUM(total_points) AS "포인트"
FROM experience_submissions
GROUP BY experience_type
ORDER BY COUNT(*) DESC;
