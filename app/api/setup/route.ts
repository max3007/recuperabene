import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/date";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const { name, operationType, operationDate, medications } = body as {
    name?: string;
    operationType?: string;
    operationDate?: string;
    medications?: string[];
  };

  if (!name?.trim() || !operationType?.trim() || !operationDate) {
    return NextResponse.json(
      { error: "Nome, tipo di operazione e data sono obbligatori." },
      { status: 400 },
    );
  }

  const parsedDate = new Date(operationDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { error: "Data dell'operazione non valida." },
      { status: 400 },
    );
  }

  // Tracker personale: un solo paziente. Se esiste già, niente doppioni.
  const existing = await prisma.patient.findFirst();
  if (existing) {
    return NextResponse.json(
      { error: "Profilo già configurato." },
      { status: 409 },
    );
  }

  const cleanMeds = (medications ?? [])
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  const patient = await prisma.patient.create({
    data: {
      name: name.trim(),
      operationType: operationType.trim(),
      operationDate: startOfLocalDay(parsedDate),
      medications: { create: cleanMeds.map((mName) => ({ name: mName })) },
    },
  });

  return NextResponse.json({ id: patient.id }, { status: 201 });
}
