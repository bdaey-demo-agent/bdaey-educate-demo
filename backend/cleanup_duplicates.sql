-- 1. Find the duplicate email(s)
SELECT "NormalizedEmail", COUNT(*)
FROM "Users"
GROUP BY "NormalizedEmail"
HAVING COUNT(*) > 1;

-- 2. Preview the duplicates that will be deleted:
SELECT * FROM "Users"
WHERE "Id" IN (
    SELECT "Id" FROM (
        SELECT "Id",
               ROW_NUMBER() OVER (PARTITION BY "NormalizedEmail" ORDER BY "CreatedAt" DESC) AS rn
        FROM "Users"
    ) AS Duplicates
    WHERE rn > 1
);

-- 3. Safety-wrapped DELETE (BEGIN/ROLLBACK — review output above first, then change ROLLBACK to COMMIT)
-- Only run if you are sure!
BEGIN TRANSACTION;

WITH Duplicates AS (
    SELECT "Id",
           ROW_NUMBER() OVER (PARTITION BY "NormalizedEmail" ORDER BY "CreatedAt" DESC) AS rn
    FROM "Users"
)
DELETE FROM "Users"
WHERE "Id" IN (
    SELECT "Id" FROM Duplicates WHERE rn > 1
);

ROLLBACK TRANSACTION;
-- To commit: replace ROLLBACK TRANSACTION; with COMMIT TRANSACTION;
