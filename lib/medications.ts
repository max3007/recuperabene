// Helper per orari, periodo di terapia e lista "dosi di oggi".

import { startOfLocalDay } from "@/lib/date";

const MS_PER_DAY = 86_400_000;

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

export type MedWriteBody = {
  name?: string;
  dosage?: string;
  times?: string;
  asNeeded?: boolean;
  startDate?: string | null;
  durationDays?: number | null;
};

// Campi scrivibili di un farmaco, normalizzati dal body della richiesta.
// `active` resta fuori: si gestisce a parte (archivia/ripristina).
export function medWriteData(body: MedWriteBody) {
  const asNeeded = body.asNeeded === true;
  const duration =
    typeof body.durationDays === "number" &&
    Number.isFinite(body.durationDays) &&
    body.durationDays > 0
      ? Math.floor(body.durationDays)
      : null;
  const startDate =
    typeof body.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate)
      ? new Date(`${body.startDate}T00:00:00.000Z`)
      : null;
  return {
    dosage: body.dosage?.trim() || null,
    times: asNeeded ? "" : serializeTimes(body.times),
    asNeeded,
    startDate,
    durationDays: duration,
  };
}

export type MedicationLike = {
  id: string;
  name: string;
  dosage: string | null;
  times: string;
  asNeeded: boolean;
  active: boolean;
  startDate: Date | null;
  durationDays: number | null;
};

// Il farmaco è in terapia nel giorno indicato? (attivo, iniziato, non scaduto)
export function isMedActiveOn(med: MedicationLike, day: Date): boolean {
  if (!med.active) return false;
  const d = startOfLocalDay(day).getTime();
  if (med.startDate && d < startOfLocalDay(med.startDate).getTime()) return false;
  if (med.startDate && med.durationDays && med.durationDays > 0) {
    const lastDay =
      startOfLocalDay(med.startDate).getTime() +
      (med.durationDays - 1) * MS_PER_DAY;
    if (d > lastDay) return false;
  }
  return true;
}

export type Dose = {
  medicationId: string;
  name: string;
  dosage: string | null;
  time: string;
  taken: boolean;
};

export type PrnMed = {
  medicationId: string;
  name: string;
  dosage: string | null;
  takenCount: number;
};

// Chiave stabile per una dose programmata presa.
export function doseKey(medicationId: string, time: string): string {
  return `${medicationId}|${time}`;
}

// Dosi programmate di oggi (farmaci a orario, attivi e nel periodo), ordinate.
export function buildTodayDoses(
  meds: MedicationLike[],
  takenKeys: Set<string>,
  day: Date = new Date(),
): Dose[] {
  const doses: Dose[] = [];
  for (const m of meds) {
    if (m.asNeeded || !isMedActiveOn(m, day)) continue;
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

// Farmaci "al bisogno" attivi oggi, con quante volte sono stati presi.
export function buildPrnMeds(
  meds: MedicationLike[],
  countByMed: Map<string, number>,
  day: Date = new Date(),
): PrnMed[] {
  return meds
    .filter((m) => m.asNeeded && isMedActiveOn(m, day))
    .map((m) => ({
      medicationId: m.id,
      name: m.name,
      dosage: m.dosage,
      takenCount: countByMed.get(m.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
