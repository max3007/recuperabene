import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/date";

// Tracker personale: un solo paziente. Prendiamo il primo (e unico).
export async function getPatient() {
  return prisma.patient.findFirst({
    include: { medications: { orderBy: { name: "asc" } } },
  });
}

// Dosi di farmaci segnate come prese OGGI, per costruire la checklist.
export async function getTodayIntakes(patientId: string) {
  return prisma.medicationIntake.findMany({
    where: { day: startOfLocalDay(), medication: { patientId } },
    select: { medicationId: true, time: true },
  });
}

export async function getCheckIns(patientId: string) {
  return prisma.checkIn.findMany({
    where: { patientId },
    orderBy: { date: "asc" },
    include: { medications: true },
  });
}
