-- When the customer ticked the privacy-policy consent box for this upload.
ALTER TABLE "Photo" ADD COLUMN "consentAt" TIMESTAMP(3);
