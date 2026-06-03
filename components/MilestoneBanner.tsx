import { milestoneForDay } from "@/lib/milestones";

// Banner di celebrazione, mostrato solo nei giorni in cui cade un traguardo.
export function MilestoneBanner({ daysSinceOp }: { daysSinceOp: number }) {
  const milestone = milestoneForDay(daysSinceOp);
  if (!milestone) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-secondary p-4 text-secondary-foreground">
      <p className="flex items-center gap-2 font-semibold">
        <span className="text-xl" aria-hidden>
          {milestone.emoji}
        </span>
        {milestone.title}
      </p>
      <p className="mt-1 text-sm">{milestone.message}</p>
    </div>
  );
}
