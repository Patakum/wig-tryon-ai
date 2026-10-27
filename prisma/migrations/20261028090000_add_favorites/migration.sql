CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

CREATE UNIQUE INDEX "Favorite_userId_wigId_key" ON "Favorite"("userId", "wigId");

ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_wigId_fkey" FOREIGN KEY ("wigId") REFERENCES "Wig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
