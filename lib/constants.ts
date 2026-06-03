// Opzioni di dominio condivise tra form, grafici e seed.

export const MOBILITY_OPTIONS = [
  { value: "bed_rest", label: "A letto", score: 1 },
  { value: "indoors", label: "Cammino in casa", score: 2 },
  { value: "outdoors", label: "Cammino fuori", score: 3 },
  { value: "normal", label: "Normale", score: 4 },
] as const;

export type MobilityValue = (typeof MOBILITY_OPTIONS)[number]["value"];

export function mobilityLabel(value: string): string {
  return MOBILITY_OPTIONS.find((m) => m.value === value)?.label ?? value;
}

export function mobilityScore(value: string): number {
  return MOBILITY_OPTIONS.find((m) => m.value === value)?.score ?? 0;
}

// Umore: 1–5 con emoji. mood = indice (1-based).
export const MOOD_OPTIONS = [
  { value: 1, emoji: "😞", label: "Molto giù" },
  { value: 2, emoji: "😕", label: "Giù" },
  { value: 3, emoji: "😐", label: "Così così" },
  { value: 4, emoji: "🙂", label: "Bene" },
  { value: 5, emoji: "😊", label: "Molto bene" },
] as const;

export function moodEmoji(value: number): string {
  return MOOD_OPTIONS.find((m) => m.value === value)?.emoji ?? "❓";
}

export function moodLabel(value: number): string {
  return MOOD_OPTIONS.find((m) => m.value === value)?.label ?? "";
}

// Feedback emoji per il livello di dolore (0–10).
export function painEmoji(level: number): string {
  if (level <= 1) return "😀";
  if (level <= 3) return "🙂";
  if (level <= 5) return "😐";
  if (level <= 7) return "😣";
  if (level <= 9) return "😖";
  return "😭";
}
