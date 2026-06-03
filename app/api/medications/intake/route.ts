import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { startOfLocalDay, currentLocalTime } from "@/lib/date";

type Body = {
  medicationId?: string;
  time?: string;
  taken?: boolean;
  // true per i farmaci "al bisogno": registra/annulla una dose all'ora corrente.
  prn?: boolean;
};

// Registra (o annulla) una dose di OGGI. Presenza della riga = assunta.
// - dose programmata: { medicationId, time, taken }
// - al bisogno (PRN): { medicationId, prn: true, taken } → ora corrente
// Si opera solo sul giorno corrente: checklist quotidiana, non editor di storico.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const medicationId = body?.medicationId;
  if (!medicationId) {
    return NextResponse.json(
      { error: "medicationId obbligatorio." },
      { status: 400 },
    );
  }

  // Scoping di sicurezza: il farmaco deve appartenere al paziente.
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

  if (body?.prn) {
    if (body.taken === false) {
      // Annulla l'ultima dose di oggi per quel farmaco.
      const latest = await prisma.medicationIntake.findFirst({
        where: { medicationId, day },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (latest) {
        await prisma.medicationIntake.delete({ where: { id: latest.id } });
      }
    } else {
      // Registra una presa all'ora corrente (italiana).
      const time = currentLocalTime();
      await prisma.medicationIntake.upsert({
        where: { medicationId_day_time: { medicationId, day, time } },
        create: { medicationId, day, time },
        update: {},
      });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Dose programmata: toggle sullo specifico orario.
  const time = body?.time;
  if (!time) {
    return NextResponse.json(
      { error: "time obbligatorio per le dosi programmate." },
      { status: 400 },
    );
  }
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
