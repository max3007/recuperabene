import { NextResponse } from "next/server";

import { getAnthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { MOBILITY_OPTIONS } from "@/lib/constants";
import {
  buildParsePrompt,
  PARSE_SCHEMA,
  PARSE_SYSTEM_PROMPT,
  PARSE_MODEL,
  type ParsedCheckin,
} from "@/lib/checkin-parse";

const VALID_MOBILITY = new Set<string>(MOBILITY_OPTIONS.map((m) => m.value));

// Interpreta una frase in linguaggio naturale in campi del check-in.
// NON scrive sul DB: restituisce solo i dati, che il form precompila.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = (body as { text?: string } | null)?.text?.trim();
  if (!text) {
    return NextResponse.json(
      { error: "Scrivi qualcosa da interpretare." },
      { status: 400 },
    );
  }

  const patient = await prisma.patient.findFirst({
    include: { medications: { select: { id: true, name: true } } },
  });
  if (!patient) {
    return NextResponse.json(
      { error: "Profilo non configurato." },
      { status: 404 },
    );
  }

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch {
    return NextResponse.json(
      { error: "Chiave API Anthropic non configurata (ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  try {
    const response = await anthropic.messages.create({
      model: PARSE_MODEL,
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: PARSE_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: { format: { type: "json_schema", schema: PARSE_SCHEMA } },
      messages: [
        {
          role: "user",
          content: buildParsePrompt(text, patient.medications),
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Risposta del modello senza contenuto.");
    }
    const parsed = JSON.parse(textBlock.text) as ParsedCheckin;

    // Sanifica i valori (il form rivede comunque, ma teniamo i range coerenti).
    const painLevel =
      typeof parsed.painLevel === "number"
        ? Math.min(10, Math.max(0, Math.round(parsed.painLevel)))
        : null;
    const mood =
      typeof parsed.mood === "number"
        ? Math.min(5, Math.max(1, Math.round(parsed.mood)))
        : null;
    const mobility =
      parsed.mobility && VALID_MOBILITY.has(parsed.mobility)
        ? parsed.mobility
        : null;

    // Mappa i nomi dei farmaci agli id del profilo (case-insensitive, match
    // anche parziale). Quelli non riconosciuti finiscono in unmatchedMedications.
    const medicationIds: string[] = [];
    const unmatchedMedications: string[] = [];
    for (const raw of parsed.medications ?? []) {
      const name = raw.trim().toLowerCase();
      if (!name) continue;
      const hit = patient.medications.find((m) => {
        const known = m.name.toLowerCase();
        return known === name || known.includes(name) || name.includes(known);
      });
      if (hit) {
        if (!medicationIds.includes(hit.id)) medicationIds.push(hit.id);
      } else {
        unmatchedMedications.push(raw.trim());
      }
    }

    return NextResponse.json(
      {
        painLevel,
        mobility,
        mood,
        notes: typeof parsed.notes === "string" ? parsed.notes.trim() : "",
        medicationIds,
        unmatchedMedications,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Errore parse check-in:", err);
    return NextResponse.json(
      { error: "Non sono riuscito a interpretare la frase. Riprova." },
      { status: 502 },
    );
  }
}
