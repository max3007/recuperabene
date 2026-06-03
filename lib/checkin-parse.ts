import { MOBILITY_OPTIONS } from "@/lib/constants";

// Modello per l'estrazione (task semplice → Haiku: veloce ed economico).
// Swappabile in un solo punto; gli insight restano su Sonnet (vedi lib/anthropic.ts).
export const PARSE_MODEL = "claude-haiku-4-5";

export type ParsedCheckin = {
  painLevel: number | null;
  mobility: string | null;
  mood: number | null;
  notes: string;
  medications: string[]; // nomi così come riconosciuti dal modello
};

const MOBILITY_VALUES = MOBILITY_OPTIONS.map((m) => m.value);

export const PARSE_SYSTEM_PROMPT = `Estrai i dati di un check-in di recupero post-operatorio da una frase in italiano.
Restituisci SEMPRE il risultato tramite il formato strutturato richiesto.

Regole:
- painLevel: intero 0-10 se la persona indica un livello di dolore, altrimenti null. Non inventare.
- mobility: uno tra ${MOBILITY_VALUES.map((v) => `"${v}"`).join(", ")} in base a come si muove ("a letto"→bed_rest, "in casa"→indoors, "fuori/giardino/passeggiata"→outdoors, "normale"→normal); null se non menzionato.
- mood: intero 1-5 (1 molto giù, 3 così così, 5 molto bene); null se non menzionato.
- medications: i farmaci che dice di aver assunto OGGI. Se uno corrisponde CHIARAMENTE a un farmaco del profilo (stesso principio attivo o nome commerciale noto, es. "tachipirina"="Paracetamolo"), usa il nome del profilo. Se è un farmaco diverso, o non sei certo che sia lo stesso, riporta il nome così come l'ha detto la persona (NON forzarlo su un farmaco del profilo solo perché simile). Lista vuota se non ne cita.
- notes: la parte descrittiva/diaristica della frase (osservazioni, sensazioni, dettagli sul momento della giornata), ripulita. Stringa vuota se non c'è nulla di descrittivo.
- Non dedurre valori non espressi. Se un dato non c'è, lascialo null (o lista/stringa vuota).`;

// Schema per gli structured outputs. Tutti i campi required; i nullable via anyOf.
export const PARSE_SCHEMA = {
  type: "object" as const,
  properties: {
    painLevel: {
      anyOf: [{ type: "integer" }, { type: "null" }],
      description: "Livello di dolore 0-10, o null.",
    },
    mobility: {
      anyOf: [{ type: "string", enum: MOBILITY_VALUES }, { type: "null" }],
      description: "Categoria di mobilità o null.",
    },
    mood: {
      anyOf: [{ type: "integer" }, { type: "null" }],
      description: "Umore 1-5, o null.",
    },
    medications: {
      type: "array",
      items: { type: "string" },
      description: "Nomi dei farmaci assunti oggi, come citati.",
    },
    notes: {
      type: "string",
      description: "Parte descrittiva della frase, ripulita (può essere vuota).",
    },
  },
  required: ["painLevel", "mobility", "mood", "medications", "notes"],
  additionalProperties: false,
};

export function buildParsePrompt(
  text: string,
  medications: { name: string }[],
): string {
  const medList =
    medications.length > 0
      ? medications.map((m) => `- ${m.name}`).join("\n")
      : "(nessun farmaco nel profilo)";

  return `Farmaci noti del profilo (usa questi nomi quando li riconosci):
${medList}

Frase da interpretare:
"""
${text}
"""`;
}
