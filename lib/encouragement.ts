// Testi caldi per la dashboard: saluto in base all'ora (fuso Italia) e un
// messaggio incoraggiante che cambia ogni giorno. Tutto curato a mano, in
// italiano, tono dolce e rassicurante — niente chiamate AI, sempre disponibile.

// Ora locale italiana, indipendente dal fuso del server (su Vercel è UTC).
function romeHour(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("it-IT", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Rome",
    }).format(now),
  );
}

export function greeting(name: string, now: Date = new Date()): string {
  const h = romeHour(now);
  const part =
    h < 5
      ? "Buonanotte"
      : h < 13
        ? "Buongiorno"
        : h < 18
          ? "Buon pomeriggio"
          : "Buonasera";
  return `${part}, ${name}`;
}

// Messaggi generali di incoraggiamento. Ne mostriamo uno al giorno, scelto in
// modo deterministico dal giorno di recupero, così cambia ogni giorno ma resta
// stabile entro la giornata.
const MESSAGES: readonly string[] = [
  "Un passo alla volta: il corpo sa come guarire, tu dagli tempo. 💛",
  "Ogni giorno che passa è un piccolo pezzo di strada in più verso te stessa.",
  "Riposare non è perdere tempo: è parte del lavoro di guarigione.",
  "Sii gentile con te oggi. Stai facendo abbastanza, anzi: stai facendo benissimo.",
  "I progressi non sono sempre lineari. Anche i giorni lenti contano.",
  "Ascolta il tuo corpo: ti sta dicendo di cosa ha bisogno.",
  "Piano piano si torna in forma. Nessuna fretta, solo cura. 🌱",
  "Hai già superato la parte più difficile. Il resto è recupero.",
  "Bevi, respira, riposa. Le piccole cose, oggi, sono le più importanti.",
  "Va bene avere giornate storte: domani è un'altra occasione.",
  "Il tuo unico compito di oggi è stare un po' meglio di ieri, anche solo un pochino.",
  "Sei più forte di quanto pensi, e non sei sola in questo. 🐱",
  "Festeggia i piccoli traguardi: alzarsi, camminare, sorridere.",
  "La guarigione ha i suoi tempi: concediti la pazienza che meriti.",
];

export function getDailyEncouragement(daysSinceOp: number): string {
  const i = ((daysSinceOp % MESSAGES.length) + MESSAGES.length) % MESSAGES.length;
  return MESSAGES[i];
}

// Etichetta del contatore giorni, con un messaggio speciale per il giorno 0.
export function recoveryDayLabel(daysSinceOp: number): string {
  if (daysSinceOp === 0) return "Oggi è il giorno dell'operazione";
  return `Giorno ${daysSinceOp} del tuo recupero`;
}
