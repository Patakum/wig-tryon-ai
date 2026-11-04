-- AlterTable
ALTER TABLE "Wig" ADD COLUMN     "color" TEXT,
ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "length" TEXT,
ADD COLUMN     "material" TEXT;

-- CreateTable
CREATE TABLE "WigImage" (
    "id" TEXT NOT NULL,
    "wigId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "angle" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WigImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WigImage_wigId_idx" ON "WigImage"("wigId");

-- AddForeignKey
ALTER TABLE "WigImage" ADD CONSTRAINT "WigImage_wigId_fkey" FOREIGN KEY ("wigId") REFERENCES "Wig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
