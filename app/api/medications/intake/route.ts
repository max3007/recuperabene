import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/date";

type Body = { medicationId?: string; time?: string; taken?: boolean };

// Segna (o annulla) una dose di OGGI come presa. Presenza della riga = assunta.
// Si opera solo sul giorno corrente: è una checklist quotidiana, non un editor
// di storico.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const medicationId = body?.medicationId;
  const time = body?.time;
  if (!medicationId || !time) {
    return NextResponse.json(
      { error: "medicationId e time sono obbligatori." },
      { status: 400 },
    );
  }

  // Verifica che il farmaco appartenga al paziente (scoping di sicurezza).
  const patient = await prisma.patient.findFirst({ select: { id: true } });
  if (!patient) {
    return NextResponse.json(
      { error: "Profilo non configurato." },
      { status: 404 },
    );
  }
  const med = await prisma.medication.findFirst({
    where: { id: medicationId, patientId: patient.id },
    select: { id: true },
  });
  if (!med) {
    return NextResponse.json({ error: "Farmaco non trovato." }, { status: 404 });
  }

  const day = startOfLocalDay();

  if (body?.taken) {
    await prisma.medicationIntake.upsert({
      where: { medicationId_day_time: { medicationId, day, time } },
      create: { medicationId, day, time },
      update: {},
    });
  } else {
    await prisma.medicationIntake.deleteMany({
      where: { medicationId, day, time },
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
