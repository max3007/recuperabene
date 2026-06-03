import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseCheckInBody } from "@/lib/checkin";

type Params = { params: { id: string } };

// Modifica un check-in esistente (anche di giorni passati, dallo storico).
export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json().catch(() => null);
  const input = parseCheckInBody(body);
  if (!input) {
    return NextResponse.json(
      { error: "Dati del check-in non validi." },
      { status: 400 },
    );
  }

  const existing = await prisma.checkIn.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Check-in non trovato." }, { status: 404 });
  }

  await prisma.checkIn.update({
    where: { id: params.id },
    data: {
      painLevel: input.painLevel,
      mobility: input.mobility,
      mood: input.mood,
      notes: input.notes,
    },
  });

  return NextResponse.json({ id: params.id }, { status: 200 });
}

// Elimina un check-in.
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.checkIn.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Check-in non trovato." }, { status: 404 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
