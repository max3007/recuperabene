import { Heart } from "lucide-react";

import {
  getDailyEncouragement,
  greeting,
  recoveryDayLabel,
} from "@/lib/encouragement";
import { nextMilestone } from "@/lib/milestones";

// Intestazione calorosa della dashboard: saluto personale, giorno di recupero
// e messaggio incoraggiante del giorno.
export function DashboardHero({
  name,
  daysSinceOp,
}: {
  name: string;
  daysSinceOp: number;
}) {
  const next = nextMilestone(daysSinceOp);
  const toNext = next ? next.day - daysSinceOp : 0;

  return (
    <section className="overflow-hidden rounded-xl bg-gradient-to-br from-primary to-teal-700 p-5 text-primary-foreground shadow-sm">
      <p className="text-sm font-medium opacity-90">
        {greeting(name)} <span aria-hidden>🐱</span>
      </p>
      <p className="mt-1 text-2xl font-bold leading-tight">
        {recoveryDayLabel(daysSinceOp)}
      </p>
      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed opacity-95">
        <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-rose-300 text-rose-300" />
        <span>{getDailyEncouragement(daysSinceOp)}</span>
      </p>
      {next && toNext > 0 && (
        <p className="mt-3 text-xs opacity-80">
          Prossimo traguardo {next.emoji} {next.title.toLowerCase()} · tra{" "}
          {toNext} {toNext === 1 ? "giorno" : "giorni"}
        </p>
      )}
    </section>
  );
}
