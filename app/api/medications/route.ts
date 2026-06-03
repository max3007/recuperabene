import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Aggiunge un farmaco al paziente.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = (body as { name?: string } | null)?.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Il nome del farmaco è obbligatorio." },
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

  const med = await prisma.medication.create({
    data: { name, patientId: patient.id },
  });

  return NextResponse.json({ id: med.id, name: med.name }, { status: 201 });
}
