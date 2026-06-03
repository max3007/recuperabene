import { NextResponse } from "next/server";

import { getAnthropic, INSIGHTS_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import {
  buildCheckInsText,
  INSIGHTS_SCHEMA,
  INSIGHTS_SYSTEM_PROMPT,
  type Insights,
} from "@/lib/insights";

export const dynamic = "force-dynamic";

export async function POST() {
  const patient = await prisma.patient.findFirst();
  if (!patient) {
    return NextResponse.json(
      { error: "Profilo non configurato." },
      { status: 404 },
    );
  }

  // Ultimi 7 check-in (più recenti), poi rimessi in ordine cronologico.
  const recent = await prisma.checkIn.findMany({
    where: { patientId: patient.id },
    orderBy: { date: "desc" },
    take: 7,
    include: { medications: true },
  });
  if (recent.length === 0) {
    return NextResponse.json(
      { error: "Nessun check-in da analizzare. Registrane almeno uno." },
      { status: 400 },
    );
  }
  const checkIns = recent.reverse();

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch {
    return NextResponse.json(
      { error: "Chiave API Anthropic non configurata (ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  const checkInsText = buildCheckInsText(patient, checkIns);

  try {
    const response = await anthropic.messages.create({
      model: INSIGHTS_MODEL,
      max_tokens: 2048,
      // System prompt STABILE → cacheabile come prefisso. La parte volatile
      // (i check-in) sta nel messaggio utente, dopo il breakpoint.
      system: [
        {
          type: "text",
          text: INSIGHTS_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      // Structured outputs nativi: la risposta è JSON conforme allo schema.
      output_config: {
        format: {
          type: "json_schema",
          schema: INSIGHTS_SCHEMA,
        },
      },
      messages: [
        {
          role: "user",
          content: `Ecco il diario di recupero. Analizzalo e restituisci l'analisi richiesta.\n\n${checkInsText}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Risposta del modello senza contenuto testuale.");
    }

    const insights = JSON.parse(textBlock.text) as Insights;
    return NextResponse.json(insights, { status: 200 });
  } catch (err) {
    console.error("Errore insights Claude:", err);
    return NextResponse.json(
      { error: "Non è stato possibile generare l'analisi. Riprova più tardi." },
      { status: 502 },
    );
  }
}
