-- AlterTable
ALTER TABLE "User"
ADD COLUMN "bio" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "company" TEXT,
ADD COLUMN "authCreatedAt" TIMESTAMP(3),
ADD COLUMN "lastSignInAt" TIMESTAMP(3),
ADD COLUMN "authRole" TEXT,
ADD COLUMN "authProvider" TEXT;
