import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { medWriteData, type MedWriteBody } from "@/lib/medications";

type Params = { params: { id: string } };

type Body = MedWriteBody & { active?: boolean };

// Aggiorna un farmaco. Supporta sia la modifica completa (richiede `name`) sia
// il solo archivia/ripristina (`active` senza `name`).
export async function PATCH(req: Request, { params }: Params) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json({ error: "Corpo non valido." }, { status: 400 });
  }

  const data: Prisma.MedicationUpdateInput = {};
  if (typeof body.active === "boolean") data.active = body.active;
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Il nome del farmaco è obbligatorio." },
        { status: 400 },
      );
    }
    Object.assign(data, { name, ...medWriteData(body) });
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nulla da aggiornare." }, { status: 400 });
  }

  try {
    await prisma.medication.update({ where: { id: params.id }, data });
  } catch {
    return NextResponse.json({ error: "Farmaco non trovato." }, { status: 404 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}

// Elimina un farmaco (hard delete). In genere si preferisce archiviare
// (PATCH active=false); il delete è una rimozione definitiva con perdita di
// storico (cascade su check-in e dosi).
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.medication.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Farmaco non trovato." }, { status: 404 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
