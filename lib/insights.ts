import type { CheckIn, Medication, Patient } from "@prisma/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { mobilityLabel, moodLabel } from "@/lib/constants";
import { daysSince } from "@/lib/date";

export type Insights = {
  summary: string;
  patterns: string[];
  suggestions: string[];
  doctorQuestions: string[];
};

type CheckInWithMeds = CheckIn & { medications: Medication[] };

// System prompt STABILE: definisce ruolo, tono e regole. Va prima della parte
// volatile (i dati dei check-in) così è cacheabile come prefisso.
export const INSIGHTS_SYSTEM_PROMPT = `Sei un assistente empatico che aiuta una persona nel suo percorso di recupero post-operatorio.
Ricevi gli ultimi giorni del suo diario (dolore, mobilità, umore, farmaci, note).

Il tuo compito è restituire un'analisi in ITALIANO, sempre tramite lo strumento fornito, con:
- un riassunto breve e incoraggiante dei progressi (2-4 frasi, caldo ma sincero);
- eventuali pattern degni di nota (es. picchi di dolore alla sera, correlazioni tra umore e mobilità);
- 2-3 suggerimenti gentili e concreti per il benessere quotidiano;
- 2-3 domande utili da porre al medico alla prossima visita.

Regole importanti:
- NON sei un medico: non fare diagnosi, non prescrivere farmaci, non dare dosaggi.
- Se i dati mostrano segnali preoccupanti (dolore in forte aumento, peggioramento netto), invita con calma a contattare il medico.
- Tono rassicurante, mai allarmante. Parla direttamente alla persona ("tu").
- Se i dati sono pochi, dillo con delicatezza e mantieni i suggerimenti generali.`;

// Schema per gli structured outputs nativi di Sonnet 4.6 (output_config.format):
// vincola la risposta a JSON valido conforme a questa forma.
export const INSIGHTS_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: {
      type: "string",
      description: "Riassunto breve e incoraggiante dei progressi (2-4 frasi).",
    },
    patterns: {
      type: "array",
      items: { type: "string" },
      description: "Pattern degni di nota osservati nei dati.",
    },
    suggestions: {
      type: "array",
      items: { type: "string" },
      description: "2-3 suggerimenti gentili e concreti.",
    },
    doctorQuestions: {
      type: "array",
      items: { type: "string" },
      description: "2-3 domande da porre al medico alla prossima visita.",
    },
  },
  required: ["summary", "patterns", "suggestions", "doctorQuestions"],
  additionalProperties: false,
};

// Serializza i check-in in un testo compatto e leggibile per il modello.
export function buildCheckInsText(
  patient: Patient,
  checkIns: CheckInWithMeds[],
): string {
  const header = `Paziente: ${patient.name}
Operazione: ${patient.operationType} (${daysSince(patient.operationDate)} giorni fa)
Numero di check-in forniti: ${checkIns.length}`;

  const rows = checkIns
    .map((c) => {
      const day = format(c.date, "EEEE d MMMM", { locale: it });
      const meds =
        c.medications.length > 0
          ? c.medications.map((m) => m.name).join(", ")
          : "nessuno";
      const note = c.notes.trim() ? c.notes.trim() : "—";
      return `- ${day}: dolore ${c.painLevel}/10, mobilità "${mobilityLabel(
        c.mobility,
      )}", umore ${moodLabel(c.mood)} (${c.mood}/5), farmaci: ${meds}. Note: ${note}`;
    })
    .join("\n");

  return `${header}\n\nDiario:\n${rows}`;
}
