import { CalendarDays, Flame } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function StatCards({
  daysSinceOp,
  streak,
}: {
  daysSinceOp: number;
  streak: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{daysSinceOp}</p>
            <p className="text-xs text-muted-foreground">
              {daysSinceOp === 1 ? "giorno" : "giorni"} dall'operazione
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{streak}</p>
            <p className="text-xs text-muted-foreground">
              {streak === 1 ? "giorno" : "giorni"} di fila loggati
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
