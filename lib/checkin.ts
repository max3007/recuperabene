import { MOBILITY_OPTIONS } from "@/lib/constants";

const VALID_MOBILITY = new Set<string>(MOBILITY_OPTIONS.map((m) => m.value));

export type CheckInInput = {
  painLevel: number;
  mobility: string;
  mood: number;
  notes: string;
};

// Valida il corpo di un check-in. Ritorna l'input pulito o null se non valido.
// I farmaci NON fanno più parte del check-in: l'assunzione si registra dalle
// dosi (MedicationIntake), unica fonte di verità.
export function parseCheckInBody(body: unknown): CheckInInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const { painLevel, mobility, mood, notes } = b;

  if (
    typeof painLevel !== "number" ||
    !Number.isInteger(painLevel) ||
    painLevel < 0 ||
    painLevel > 10 ||
    typeof mood !== "number" ||
    !Number.isInteger(mood) ||
    mood < 1 ||
    mood > 5 ||
    typeof mobility !== "string" ||
    !VALID_MOBILITY.has(mobility)
  ) {
    return null;
  }

  return {
    painLevel,
    mobility,
    mood,
    notes: typeof notes === "string" ? notes.trim() : "",
  };
}
