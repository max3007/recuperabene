import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Azzera tutti i dati: cancellando il paziente, check-in e farmaci cadono in
// cascata (onDelete: Cascade). Dopo il reset l'app torna al setup iniziale.
export async function POST() {
  await prisma.patient.deleteMany();
  return NextResponse.json({ ok: true }, { status: 200 });
}
