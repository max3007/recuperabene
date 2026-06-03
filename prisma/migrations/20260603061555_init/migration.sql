-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "operationDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "Medication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "painLevel" INTEGER NOT NULL,
    "mobility" TEXT NOT NULL,
    "mood" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "CheckIn_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CheckInToMedication" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CheckInToMedication_A_fkey" FOREIGN KEY ("A") REFERENCES "CheckIn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CheckInToMedication_B_fkey" FOREIGN KEY ("B") REFERENCES "Medication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_patientId_date_key" ON "CheckIn"("patientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "_CheckInToMedication_AB_unique" ON "_CheckInToMedication"("A", "B");

-- CreateIndex
CREATE INDEX "_CheckInToMedication_B_index" ON "_CheckInToMedication"("B");
