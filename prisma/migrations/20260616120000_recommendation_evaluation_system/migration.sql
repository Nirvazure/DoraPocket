ALTER TABLE "RecommendationSession"
ADD COLUMN "starterPath" TEXT,
ADD COLUMN "clarifyTurnCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "confidenceLevel" TEXT,
ADD COLUMN "openedToolId" TEXT,
ADD COLUMN "savedToolId" TEXT,
ADD COLUMN "evaluatedAt" TIMESTAMP(3);

CREATE TABLE "RecommendationEvaluation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recommendationSessionId" TEXT NOT NULL,
  "selectedToolId" TEXT,
  "opened" BOOLEAN NOT NULL DEFAULT false,
  "saved" BOOLEAN NOT NULL DEFAULT false,
  "tried" BOOLEAN NOT NULL DEFAULT false,
  "helpful" BOOLEAN,
  "outcome" TEXT,
  "rating" INTEGER,
  "tags" TEXT[],
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecommendationEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecommendationEvaluation_userId_recommendationSessionId_key"
ON "RecommendationEvaluation"("userId", "recommendationSessionId");

ALTER TABLE "RecommendationEvaluation"
ADD CONSTRAINT "RecommendationEvaluation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecommendationEvaluation"
ADD CONSTRAINT "RecommendationEvaluation_recommendationSessionId_fkey"
FOREIGN KEY ("recommendationSessionId") REFERENCES "RecommendationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
