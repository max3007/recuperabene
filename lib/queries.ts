import { prisma } from "@/lib/prisma";

// Tracker personale: un solo paziente. Prendiamo il primo (e unico).
export async function getPatient() {
  return prisma.patient.findFirst({
    include: { medications: { orderBy: { name: "asc" } } },
  });
}

export async function getCheckIns(patientId: string) {
  return prisma.checkIn.findMany({
    where: { patientId },
    orderBy: { date: "asc" },
    include: { medications: true },
  });
}
