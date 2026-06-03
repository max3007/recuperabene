import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { startOfLocalDay } from "@/lib/date";

// Aggiorna il profilo del paziente (nome, tipo operazione, data).
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const { name, operationType, operationDate } = body as {
    name?: string;
    operationType?: string;
    operationDate?: string;
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

  const patient = await prisma.patient.findFirst();
  if (!patient) {
    return NextResponse.json(
      { error: "Profilo non configurato." },
      { status: 404 },
    );
  }

  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      name: name.trim(),
      operationType: operationType.trim(),
      operationDate: startOfLocalDay(parsedDate),
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
