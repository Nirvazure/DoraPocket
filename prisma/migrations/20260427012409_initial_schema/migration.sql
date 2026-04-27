-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT,
    "nickname" TEXT NOT NULL,
    "avatarSrc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voicePlaybackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "voicePlaybackMode" TEXT NOT NULL DEFAULT 'key-result',
    "soundEffectsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultInputMode" TEXT NOT NULL DEFAULT 'text',
    "autoSaveToPocketEnabled" BOOLEAN NOT NULL DEFAULT true,
    "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "explanationMode" TEXT NOT NULL DEFAULT 'standard',
    "fontPreset" TEXT NOT NULL DEFAULT 'c',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "iconType" TEXT,
    "iconText" TEXT,
    "iconImageUrl" TEXT,
    "iconImageLocalPath" TEXT,
    "url" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executionMode" TEXT NOT NULL,
    "pricingModel" TEXT NOT NULL,
    "requiresAuth" BOOLEAN NOT NULL,
    "platform" TEXT NOT NULL,
    "capabilities" TEXT[],
    "recommendedFor" TEXT[],
    "sourceNote" TEXT,
    "trustSignals" JSONB NOT NULL,
    "subscriptionSupport" BOOLEAN NOT NULL,
    "defaultArgs" JSONB,
    "isBuiltin" BOOLEAN NOT NULL DEFAULT false,
    "siteHostname" TEXT,
    "marketAssetOrigin" TEXT,
    "seedSource" TEXT NOT NULL DEFAULT 'system_seed',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PocketItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "sourceQuestion" TEXT,
    "presetArgs" JSONB,

    CONSTRAINT "PocketItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "starRating" INTEGER NOT NULL,
    "selectedTags" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'review',

    CONSTRAINT "MarketSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "subscriptions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ToolActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatHistoryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userText" TEXT NOT NULL,
    "assistantText" TEXT NOT NULL,
    "selectedToolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceProfileOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCategories" TEXT[],
    "preferredTags" TEXT[],
    "preferredPlatforms" TEXT[],
    "preferredPricing" TEXT[],
    "preferredExecutionModes" TEXT[],
    "avoidAuthWall" BOOLEAN,
    "prefersSubscriptionTools" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceProfileOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userText" TEXT NOT NULL,
    "taskFrame" JSONB NOT NULL,
    "selectedToolId" TEXT,
    "candidates" JSONB NOT NULL,
    "selectionReason" TEXT NOT NULL,
    "selectionSignals" TEXT[],
    "preferenceSignals" TEXT[],
    "finalText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataMigrationState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDataImportedAt" TIMESTAMP(3),
    "toolSeedImportedAt" TIMESTAMP(3),

    CONSTRAINT "DataMigrationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PocketItem_userId_toolId_key" ON "PocketItem"("userId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketFeedback_userId_toolId_key" ON "MarketFeedback"("userId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketSubscription_userId_toolId_key" ON "MarketSubscription"("userId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolActivity_userId_toolId_key" ON "ToolActivity"("userId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceProfileOverride_userId_key" ON "PreferenceProfileOverride"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DataMigrationState_userId_key" ON "DataMigrationState"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PocketItem" ADD CONSTRAINT "PocketItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PocketItem" ADD CONSTRAINT "PocketItem_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketFeedback" ADD CONSTRAINT "MarketFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketFeedback" ADD CONSTRAINT "MarketFeedback_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSubscription" ADD CONSTRAINT "MarketSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSubscription" ADD CONSTRAINT "MarketSubscription_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSubmission" ADD CONSTRAINT "MarketSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolActivity" ADD CONSTRAINT "ToolActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolActivity" ADD CONSTRAINT "ToolActivity_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatHistoryEntry" ADD CONSTRAINT "ChatHistoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceProfileOverride" ADD CONSTRAINT "PreferenceProfileOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationSession" ADD CONSTRAINT "RecommendationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataMigrationState" ADD CONSTRAINT "DataMigrationState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
