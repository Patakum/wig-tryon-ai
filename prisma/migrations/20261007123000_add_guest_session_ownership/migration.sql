CREATE TABLE "GuestSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestSession_tokenHash_key"
    ON "GuestSession"("tokenHash");

CREATE INDEX "GuestSession_expiresAt_idx"
    ON "GuestSession"("expiresAt");

ALTER TABLE "Photo"
    ADD COLUMN "guestSessionId" TEXT,
    ADD CONSTRAINT "Photo_owner_xor_check"
        CHECK ("userId" IS NULL OR "guestSessionId" IS NULL),
    ADD CONSTRAINT "Photo_guestSessionId_fkey"
        FOREIGN KEY ("guestSessionId")
        REFERENCES "GuestSession"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;

CREATE INDEX "Photo_guestSessionId_idx"
    ON "Photo"("guestSessionId");

ALTER TABLE "Generation"
    ADD COLUMN "guestSessionId" TEXT,
    ADD CONSTRAINT "Generation_owner_xor_check"
        CHECK ("userId" IS NULL OR "guestSessionId" IS NULL),
    ADD CONSTRAINT "Generation_guestSessionId_fkey"
        FOREIGN KEY ("guestSessionId")
        REFERENCES "GuestSession"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;

CREATE INDEX "Generation_guestSessionId_idx"
    ON "Generation"("guestSessionId");
