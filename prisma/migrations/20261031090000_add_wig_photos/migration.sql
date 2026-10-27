CREATE TABLE "WigPhoto" (
    "id" TEXT NOT NULL,
    "wigId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WigPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WigPhoto_wigId_position_idx" ON "WigPhoto"("wigId", "position");

ALTER TABLE "WigPhoto" ADD CONSTRAINT "WigPhoto_wigId_fkey" FOREIGN KEY ("wigId") REFERENCES "Wig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every existing wig keeps its current image as its main (position 0) photo.
INSERT INTO "WigPhoto" ("id", "wigId", "imageUrl", "position")
SELECT gen_random_uuid()::text, "id", "imageUrl", 0 FROM "Wig";
