-- CreateTable
CREATE TABLE "Counterparty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "counterparty" TEXT NOT NULL DEFAULT '',
    "clientId" TEXT NOT NULL DEFAULT '',
    "misShortname" TEXT NOT NULL DEFAULT '',
    "directoryName" TEXT NOT NULL DEFAULT '',
    "directoryEmail" TEXT NOT NULL DEFAULT '',
    "directoryPhone" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdBy" TEXT NOT NULL DEFAULT '',
    "createdOn" TEXT NOT NULL DEFAULT '',
    "modifiedBy" TEXT NOT NULL DEFAULT '',
    "lastModifiedOn" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "uploadedBy" TEXT NOT NULL DEFAULT '',
    "lastModified" TEXT NOT NULL DEFAULT '',
    "counterpartyId" TEXT NOT NULL,
    CONSTRAINT "Document_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteName" TEXT NOT NULL DEFAULT '',
    "resourceType" TEXT NOT NULL DEFAULT '',
    "esiId" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "zipCode" TEXT NOT NULL DEFAULT '',
    "zipCodePlus4" TEXT NOT NULL DEFAULT '',
    "contractStartDate" TEXT NOT NULL DEFAULT '',
    "contractEndDate" TEXT NOT NULL DEFAULT '',
    "tdsp" TEXT NOT NULL DEFAULT '',
    "realTimeOperations" BOOLEAN NOT NULL DEFAULT false,
    "esrAssetCode" TEXT NOT NULL DEFAULT '',
    "esrStationVoltage" TEXT NOT NULL DEFAULT '',
    "esrTotalLoadAtPod" TEXT NOT NULL DEFAULT '',
    "esrInterruptibleLoad" TEXT NOT NULL DEFAULT '',
    "nclrAssetCode" TEXT NOT NULL DEFAULT '',
    "nclrStationVoltage" TEXT NOT NULL DEFAULT '',
    "nclrStorageCapacity" TEXT NOT NULL DEFAULT '',
    "nclrPowerCapacity" TEXT NOT NULL DEFAULT '',
    "nclrProgramEcrs" BOOLEAN NOT NULL DEFAULT false,
    "nclrProgramRegup" BOOLEAN NOT NULL DEFAULT false,
    "nclrProgramRegdown" BOOLEAN NOT NULL DEFAULT false,
    "nclrProgramRrs" BOOLEAN NOT NULL DEFAULT false,
    "nclrProgramNonSpin" BOOLEAN NOT NULL DEFAULT false,
    "counterpartyId" TEXT NOT NULL,
    CONSTRAINT "Site_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operatorName" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "operatorId" TEXT NOT NULL,
    "moduleRealTimeOps" BOOLEAN NOT NULL DEFAULT false,
    "moduleReportsRepo" BOOLEAN NOT NULL DEFAULT false,
    "moduleCryptoMiners" BOOLEAN NOT NULL DEFAULT false,
    "moduleIndirectMarket" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_operatorId_key" ON "Operator"("operatorId");
