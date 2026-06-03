import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/date";
import { ownedMedicationIds, parseCheckInBody } from "@/lib/checkin";

// Crea o aggiorna il check-in di OGGI (uno per giorno, editabile entro mezzanotte).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const input = parseCheckInBody(body);
  if (!input) {
    return NextResponse.json(
      { error: "Dati del check-in non validi." },
      { status: 400 },
    );
  }

  const patient = await prisma.patient.findFirst({
    include: { medications: { select: { id: true } } },
  });
  if (!patient) {
    return NextResponse.json(
      { error: "Profilo non configurato." },
      { status: 404 },
    );
  }

  const today = startOfLocalDay();
  const meds = ownedMedicationIds(
    input.medicationIds,
    patient.medications.map((m) => m.id),
  ).map((id) => ({ id }));

  // upsert sulla coppia (paziente, giorno): aggiorna se oggi esiste già.
  const checkIn = await prisma.checkIn.upsert({
    where: { patientId_date: { patientId: patient.id, date: today } },
    create: {
      patientId: patient.id,
      date: today,
      painLevel: input.painLevel,
      mobility: input.mobility,
      mood: input.mood,
      notes: input.notes,
      medications: { connect: meds },
    },
    update: {
      painLevel: input.painLevel,
      mobility: input.mobility,
      mood: input.mood,
      notes: input.notes,
      medications: { set: meds },
    },
  });

  return NextResponse.json({ id: checkIn.id }, { status: 200 });
}
