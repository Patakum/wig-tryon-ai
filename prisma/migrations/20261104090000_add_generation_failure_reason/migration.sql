-- Why a generation failed: quota (provider credits ended), timeout, or error.
ALTER TABLE "Generation" ADD COLUMN "failureReason" TEXT;
