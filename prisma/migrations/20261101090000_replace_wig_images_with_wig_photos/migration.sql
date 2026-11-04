-- WigPhoto is the wig gallery. Keep any photos already uploaded to the older
-- WigImage table by appending them after each wig's existing photos (the
-- gallery holds at most 5 per wig), then drop the old table.
INSERT INTO "WigPhoto" ("id", "wigId", "imageUrl", "position", "createdAt")
SELECT ranked."id", ranked."wigId", ranked."imageUrl", ranked."position", ranked."createdAt"
FROM (
    SELECT
        i."id",
        i."wigId",
        i."imageUrl",
        i."createdAt",
        COALESCE(
            (SELECT MAX(p."position") FROM "WigPhoto" p WHERE p."wigId" = i."wigId"),
            -1
        ) + ROW_NUMBER() OVER (
            PARTITION BY i."wigId" ORDER BY i."order", i."createdAt", i."id"
        ) AS "position"
    FROM "WigImage" i
    WHERE EXISTS (SELECT 1 FROM "Wig" w WHERE w."id" = i."wigId")
) ranked
WHERE ranked."position" < 5;

DROP TABLE "WigImage";
