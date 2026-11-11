-- CreateTable
CREATE TABLE "BusinessInfo" (
    "id" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "openingHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessInfo_pkey" PRIMARY KEY ("id")
);
