import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/date";
import { MOBILITY_OPTIONS } from "@/lib/constants";

const VALID_MOBILITY = new Set<string>(MOBILITY_OPTIONS.map((m) => m.value));

// Crea o aggiorna il check-in di OGGI (uno per giorno, editabile entro mezzanotte).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const { painLevel, mobility, mood, notes, medicationIds } = body as {
    painLevel?: number;
    mobility?: string;
    mood?: number;
    notes?: string;
    medicationIds?: string[];
  };

  if (
    typeof painLevel !== "number" ||
    painLevel < 0 ||
    painLevel > 10 ||
    typeof mood !== "number" ||
    mood < 1 ||
    mood > 5 ||
    !mobility ||
    !VALID_MOBILITY.has(mobility)
  ) {
    return NextResponse.json(
      { error: "Dati del check-in non validi." },
      { status: 400 },
    );
  }

  const patient = await prisma.patient.findFirst();
  if (!patient) {
    return NextResponse.json(
      { error: "Profilo non configurato." },
      { status: 404 },
    );
  }

  const today = startOfLocalDay();
  const meds = (medicationIds ?? []).map((id) => ({ id }));

  // upsert sulla coppia (paziente, giorno): aggiorna se oggi esiste già.
  const checkIn = await prisma.checkIn.upsert({
    where: { patientId_date: { patientId: patient.id, date: today } },
    create: {
      patientId: patient.id,
      date: today,
      painLevel,
      mobility,
      mood,
      notes: notes?.trim() ?? "",
      medications: { connect: meds },
    },
    update: {
      painLevel,
      mobility,
      mood,
      notes: notes?.trim() ?? "",
      // set: rimpiazza l'intera lista dei farmaci assunti
      medications: { set: meds },
    },
  });

  return NextResponse.json({ id: checkIn.id }, { status: 200 });
}
