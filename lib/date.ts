import { differenceInCalendarDays } from "date-fns";

// Mezzanotte locale di una data: usata come chiave-giorno per i check-in.
// Importante: usiamo la data *locale*, non UTC, per evitare che un check-in
// serale finisca nel giorno sbagliato.
export function startOfLocalDay(d: Date = new Date()): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

// Giorni trascorsi dall'operazione (0 = giorno dell'operazione).
export function daysSince(operationDate: Date, from: Date = new Date()): number {
  return Math.max(0, differenceInCalendarDays(from, operationDate));
}

// Streak: numero di giorni consecutivi loggati fino a oggi (o ieri).
// Lo streak resta valido se l'ultimo check-in è di oggi o di ieri; si azzera
// se manca più di un giorno.
export function calcStreak(checkInDates: Date[], today: Date = new Date()): number {
  if (checkInDates.length === 0) return 0;

  const days = new Set(
    checkInDates.map((d) => startOfLocalDay(d).getTime()),
  );

  const start = startOfLocalDay(today);
  const yesterday = new Date(start);
  yesterday.setDate(yesterday.getDate() - 1);

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
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
