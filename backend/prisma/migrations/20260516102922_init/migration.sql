-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "productsScanned" INTEGER NOT NULL,
    "variantsScanned" INTEGER NOT NULL,
    "issuesFound" INTEGER NOT NULL,
    "criticalCount" INTEGER NOT NULL,
    "warningCount" INTEGER NOT NULL,
    "infoCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanIssue" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shopifyVariantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(65,30),
    "compareAtPrice" DECIMAL(65,30),
    "issueType" TEXT NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- CreateIndex
CREATE INDEX "ScanIssue_scanId_idx" ON "ScanIssue"("scanId");

-- CreateIndex
CREATE INDEX "ScanIssue_severity_idx" ON "ScanIssue"("severity");

-- CreateIndex
CREATE INDEX "ScanIssue_issueType_idx" ON "ScanIssue"("issueType");

-- AddForeignKey
ALTER TABLE "ScanIssue" ADD CONSTRAINT "ScanIssue_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
