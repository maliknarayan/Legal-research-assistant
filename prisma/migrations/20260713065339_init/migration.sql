-- CreateTable
CREATE TABLE "Research" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'Untitled research',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CaseFacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "researchId" TEXT NOT NULL,
    "facts" TEXT NOT NULL DEFAULT '',
    "timeline" TEXT NOT NULL DEFAULT '',
    "parties" TEXT NOT NULL DEFAULT '',
    "reliefSought" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CaseFacts_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LawResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "researchId" TEXT NOT NULL,
    "act" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT '',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LawResult_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Precedent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "researchId" TEXT NOT NULL,
    "caseName" TEXT NOT NULL,
    "court" TEXT NOT NULL DEFAULT '',
    "citation" TEXT NOT NULL DEFAULT '',
    "year" TEXT NOT NULL DEFAULT '',
    "legalPrinciple" TEXT NOT NULL DEFAULT '',
    "relevance" TEXT NOT NULL DEFAULT '',
    "similarityScore" REAL NOT NULL DEFAULT 0,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "sourceUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Precedent_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "researchId" TEXT NOT NULL,
    "issues" TEXT NOT NULL DEFAULT '',
    "applicableLaw" TEXT NOT NULL DEFAULT '',
    "strengths" TEXT NOT NULL DEFAULT '',
    "weaknesses" TEXT NOT NULL DEFAULT '',
    "missingFacts" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Analysis_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Argument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "researchId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "supportingLaw" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Argument_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "researchId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recommendation_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CaseFacts_researchId_key" ON "CaseFacts"("researchId");

-- CreateIndex
CREATE INDEX "LawResult_researchId_idx" ON "LawResult"("researchId");

-- CreateIndex
CREATE INDEX "Precedent_researchId_idx" ON "Precedent"("researchId");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_researchId_key" ON "Analysis"("researchId");

-- CreateIndex
CREATE INDEX "Argument_researchId_idx" ON "Argument"("researchId");

-- CreateIndex
CREATE INDEX "Recommendation_researchId_idx" ON "Recommendation"("researchId");
