// Helper per gli orari dei farmaci e la lista "dosi di oggi".

// Normalizza un input libero di orari in una lista ordinata di "HH:MM" valide,
// senza duplicati. Accetta separatori virgola e voci tipo "8:0" → "08:00".
export function parseTimes(csv: string | null | undefined): string[] {
  if (!csv) return [];
  const set = new Set<string>();
  for (const raw of csv.split(",")) {
    const m = raw.trim().match(/^(\d{1,2}):(\d{1,2})$/);
    if (!m) continue;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) continue;
    set.add(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return [...set].sort();
}

// CSV normalizzato da salvare nel DB.
export function serializeTimes(csv: string | null | undefined): string {
  return parseTimes(csv).join(",");
}

export type MedicationLike = {
  id: string;
  name: string;
  dosage: string | null;
  times: string;
};

export type Dose = {
  medicationId: string;
  name: string;
  dosage: string | null;
  time: string;
  taken: boolean;
};

// Chiave stabile per una dose presa, usata nel Set lato server/client.
export function doseKey(medicationId: string, time: string): string {
  return `${medicationId}|${time}`;
}

// Espande i farmaci nelle singole dosi di oggi, ordinate per orario.
export function buildTodayDoses(
  meds: MedicationLike[],
  takenKeys: Set<string>,
): Dose[] {
  const doses: Dose[] = [];
  for (const m of meds) {
    for (const time of parseTimes(m.times)) {
      doses.push({
        medicationId: m.id,
        name: m.name,
        dosage: m.dosage,
        time,
        taken: takenKeys.has(doseKey(m.id, time)),
      });
    }
  }
  return doses.sort(
    (a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name),
  );
}
