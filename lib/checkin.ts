import { MOBILITY_OPTIONS } from "@/lib/constants";

const VALID_MOBILITY = new Set<string>(MOBILITY_OPTIONS.map((m) => m.value));

export type CheckInInput = {
  painLevel: number;
  mobility: string;
  mood: number;
  notes: string;
  medicationIds: string[];
};

// Valida il corpo di un check-in. Ritorna l'input pulito o null se non valido.
// La validazione dell'appartenenza dei farmaci avviene a parte (serve il paziente).
export function parseCheckInBody(body: unknown): CheckInInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const { painLevel, mobility, mood, notes, medicationIds } = b;

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

  const ids = Array.isArray(medicationIds)
    ? medicationIds.filter((id): id is string => typeof id === "string")
    : [];

  return {
    painLevel,
    mobility,
    mood,
    notes: typeof notes === "string" ? notes.trim() : "",
    medicationIds: ids,
  };
}

// Tiene solo i farmaci che appartengono davvero al paziente (security: evita di
// collegare ID arbitrari a un check-in).
export function ownedMedicationIds(
  requested: string[],
  patientMedicationIds: string[],
): string[] {
  const owned = new Set(patientMedicationIds);
  return requested.filter((id) => owned.has(id));
}
