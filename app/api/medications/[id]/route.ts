import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// Rinomina un farmaco.
export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json().catch(() => null);
  const name = (body as { name?: string } | null)?.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Il nome del farmaco è obbligatorio." },
      { status: 400 },
    );
  }

  try {
    await prisma.medication.update({
      where: { id: params.id },
      data: { name },
    });
  } catch {
    return NextResponse.json({ error: "Farmaco non trovato." }, { status: 404 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}

// Elimina un farmaco. Nota: lo scollega anche dai check-in passati in cui era
// segnato come assunto (relazione molti-a-molti), quindi è una perdita di storico.
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.medication.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Farmaco non trovato." }, { status: 404 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
