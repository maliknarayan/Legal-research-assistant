-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Argument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "researchId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "supportingLaw" TEXT NOT NULL DEFAULT '',
    "sourcePassageId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Argument_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Argument" ("content", "createdAt", "id", "researchId", "side", "supportingLaw") SELECT "content", "createdAt", "id", "researchId", "side", "supportingLaw" FROM "Argument";
DROP TABLE "Argument";
ALTER TABLE "new_Argument" RENAME TO "Argument";
CREATE INDEX "Argument_researchId_idx" ON "Argument"("researchId");
CREATE TABLE "new_LawResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "researchId" TEXT NOT NULL,
    "act" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT '',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "sourceDocId" TEXT NOT NULL DEFAULT '',
    "sourcePassageId" TEXT NOT NULL DEFAULT '',
    "quote" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LawResult_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LawResult" ("act", "createdAt", "explanation", "id", "reason", "researchId", "section", "verified") SELECT "act", "createdAt", "explanation", "id", "reason", "researchId", "section", "verified" FROM "LawResult";
DROP TABLE "LawResult";
ALTER TABLE "new_LawResult" RENAME TO "LawResult";
CREATE INDEX "LawResult_researchId_idx" ON "LawResult"("researchId");
CREATE TABLE "new_Precedent" (
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
    "sourceDocId" TEXT NOT NULL DEFAULT '',
    "sourcePassageId" TEXT NOT NULL DEFAULT '',
    "quote" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Precedent_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Precedent" ("caseName", "citation", "court", "createdAt", "id", "legalPrinciple", "relevance", "researchId", "similarityScore", "sourceUrl", "verificationStatus", "year") SELECT "caseName", "citation", "court", "createdAt", "id", "legalPrinciple", "relevance", "researchId", "similarityScore", "sourceUrl", "verificationStatus", "year" FROM "Precedent";
DROP TABLE "Precedent";
ALTER TABLE "new_Precedent" RENAME TO "Precedent";
CREATE INDEX "Precedent_researchId_idx" ON "Precedent"("researchId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
