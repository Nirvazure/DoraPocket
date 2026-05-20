-- Track lightweight source imports for Tool Hub growth.
CREATE TABLE "ToolSourceInput" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "rawText" TEXT,
    "submittedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stats" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolSourceInput_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Tool"
ADD COLUMN "ingestSourceInputId" TEXT,
ADD COLUMN "ingestConfidence" DOUBLE PRECISION,
ADD COLUMN "ingestReason" TEXT,
ADD COLUMN "firstSeenAt" TIMESTAMP(3);

ALTER TABLE "ToolSourceInput"
ADD CONSTRAINT "ToolSourceInput_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Tool"
ADD CONSTRAINT "Tool_ingestSourceInputId_fkey"
FOREIGN KEY ("ingestSourceInputId") REFERENCES "ToolSourceInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;
