-- Keep only the newest feedback per generation before enforcing uniqueness.
DELETE FROM "Feedback" AS older
USING "Feedback" AS newer
WHERE older."generationId" = newer."generationId"
  AND (
    older."createdAt" < newer."createdAt"
    OR (older."createdAt" = newer."createdAt" AND older."id" < newer."id")
  );

ALTER TABLE "Feedback"
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Feedback" SET "updatedAt" = "createdAt";

ALTER TABLE "Feedback" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX "Feedback_generationId_key" ON "Feedback"("generationId");
