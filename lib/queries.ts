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
  });
}

// Nomi distinti dei farmaci presi per ciascun giorno (dalle dosi registrate).
// Chiave = mezzanotte UTC del giorno (vedi startOfLocalDay). Usato dallo storico.
export async function getMedNamesByDay(
  patientId: string,
): Promise<Map<number, string[]>> {
  const intakes = await prisma.medicationIntake.findMany({
    where: { medication: { patientId } },
    select: { day: true, medication: { select: { name: true } } },
  });
  const byDay = new Map<number, Set<string>>();
  for (const i of intakes) {
    const key = startOfLocalDay(i.day).getTime();
    if (!byDay.has(key)) byDay.set(key, new Set());
    byDay.get(key)!.add(i.medication.name);
  }
  return new Map(
    [...byDay].map(([key, names]) => [key, [...names].sort()]),
  );
}
