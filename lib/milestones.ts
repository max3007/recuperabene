// Traguardi del recupero: piccole celebrazioni nei giorni-chiave dall'operazione.
// Servono a dare senso al percorso, non a misurare nulla di clinico.

export type Milestone = {
  day: number;
  emoji: string;
  title: string;
  message: string;
};

const MILESTONES: readonly Milestone[] = [
  {
    day: 0,
    emoji: "💛",
    title: "Operazione fatta",
    message: "Il passo più grande è alle spalle. Ora si recupera, con calma.",
  },
  {
    day: 1,
    emoji: "🌱",
    title: "Primo giorno superato",
    message: "Il primo è sempre il più impegnativo. Sei già più in là di ieri.",
  },
  {
    day: 3,
    emoji: "✨",
    title: "Tre giorni",
    message: "I primi giorni sono fatti. Spesso da qui si inizia a respirare meglio.",
  },
  {
    day: 7,
    emoji: "🎉",
    title: "Prima settimana!",
    message: "Una settimana intera di recupero. Un bel traguardo, complimenti.",
  },
  {
    day: 14,
    emoji: "💪",
    title: "Due settimane",
    message: "Quattordici giorni: il corpo sta facendo un gran lavoro silenzioso.",
  },
  {
    day: 21,
    emoji: "🌟",
    title: "Tre settimane",
    message: "Tre settimane. Guarda quanta strada hai già fatto.",
  },
  {
    day: 30,
    emoji: "🏆",
    title: "Un mese di recupero",
    message: "Un mese intero. Sei stata costante e paziente: bravissima.",
  },
];

// Traguardo raggiunto esattamente oggi (se c'è).
export function milestoneForDay(daysSinceOp: number): Milestone | undefined {
  return MILESTONES.find((m) => m.day === daysSinceOp);
}

// Prossimo traguardo in arrivo (per il "tra X giorni").
export function nextMilestone(daysSinceOp: number): Milestone | undefined {
  return MILESTONES.find((m) => m.day > daysSinceOp);
}
