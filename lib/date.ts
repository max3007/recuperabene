// Giorno "civile" italiano come chiave-giorno per check-in, farmaci e streak.
//
// Importante: su Vercel il runtime è in UTC, quindi non possiamo affidarci al
// fuso della macchina (e `TZ` è un nome riservato su Vercel, non impostabile).
// Calcoliamo esplicitamente la data civile in Europe/Rome e la rappresentiamo
// come mezzanotte UTC di quella data: una chiave canonica, stabile e
// confrontabile, indipendente dal fuso del runtime.
const MS_PER_DAY = 86_400_000;

export function startOfLocalDay(d: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

// Ora corrente "HH:MM" in Europe/Rome (per registrare una dose al bisogno).
export function currentLocalTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

// Giorni trascorsi dall'operazione (0 = giorno dell'operazione).
export function daysSince(operationDate: Date, from: Date = new Date()): number {
  const diff =
    startOfLocalDay(from).getTime() - startOfLocalDay(operationDate).getTime();
  return Math.max(0, Math.round(diff / MS_PER_DAY));
}

// Streak: numero di giorni consecutivi loggati fino a oggi (o ieri).
// Lo streak resta valido se l'ultimo check-in è di oggi o di ieri; si azzera
// se manca più di un giorno.
export function calcStreak(
  checkInDates: Date[],
  today: Date = new Date(),
): number {
  if (checkInDates.length === 0) return 0;

  const days = new Set(checkInDates.map((d) => startOfLocalDay(d).getTime()));

  const start = startOfLocalDay(today);
  const yesterday = new Date(start.getTime() - MS_PER_DAY);

  // Da dove partire a contare: oggi se loggato, altrimenti ieri.
  let cursor: Date;
  if (days.has(start.getTime())) {
    cursor = start;
  } else if (days.has(yesterday.getTime())) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - MS_PER_DAY);
  }
  return streak;
}
