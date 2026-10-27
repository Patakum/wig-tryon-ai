-- Private (authenticated) Cloudinary assets are referenced by public ID and
-- signed on demand. Legacy rows keep their old public URL until migrated.
ALTER TABLE "Photo" ADD COLUMN "imagePublicId" TEXT;

ALTER TABLE "Generation"
    ADD COLUMN "resultPublicId" TEXT,
    ADD COLUMN "adminCanSeeSelfie" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "adminCanSeeResult" BOOLEAN NOT NULL DEFAULT true;
