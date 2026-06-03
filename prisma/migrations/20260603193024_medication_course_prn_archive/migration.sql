-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Medication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "times" TEXT NOT NULL DEFAULT '',
    "asNeeded" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME,
    "durationDays" INTEGER,
    "patientId" TEXT NOT NULL,
    CONSTRAINT "Medication_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Medication" ("dosage", "id", "name", "patientId", "times") SELECT "dosage", "id", "name", "patientId", "times" FROM "Medication";
DROP TABLE "Medication";
ALTER TABLE "new_Medication" RENAME TO "Medication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
