"use client";

import { useState } from "react";
import { Check, Pill } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { doseKey, type Dose } from "@/lib/medications";

// Checklist "Farmaci di oggi": orari, dose, e spunta per segnare la dose presa.
// Stato ottimistico locale; in caso di errore di rete, ripristina.
export function TodayMeds({ doses }: { doses: Dose[] }) {
  const [taken, setTaken] = useState<Set<string>>(
    () => new Set(doses.filter((d) => d.taken).map((d) => doseKey(d.medicationId, d.time))),
  );
  const [busy, setBusy] = useState<string | null>(null);

  if (doses.length === 0) return null;

  async function toggle(dose: Dose) {
    const key = doseKey(dose.medicationId, dose.time);
    const next = !taken.has(key);

    // Ottimistico
    setTaken((prev) => {
      const s = new Set(prev);
      if (next) s.add(key);
      else s.delete(key);
      return s;
    });
    setBusy(key);

    const res = await fetch("/api/medications/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicationId: dose.medicationId,
        time: dose.time,
        taken: next,
      }),
    }).catch(() => null);
    setBusy(null);

    if (!res || !res.ok) {
      // Ripristina in caso di errore
      setTaken((prev) => {
        const s = new Set(prev);
        if (next) s.delete(key);
        else s.add(key);
        return s;
      });
    }
  }

  const doneCount = doses.filter((d) =>
    taken.has(doseKey(d.medicationId, d.time)),
  ).length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Pill className="h-4 w-4 text-primary" /> Farmaci di oggi
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{doses.length} prese
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        {doses.map((dose) => {
          const key = doseKey(dose.medicationId, dose.time);
          const isTaken = taken.has(key);
          return (
            <button
              key={key}
              type="button"
              disabled={busy === key}
              onClick={() => toggle(dose)}
              aria-pressed={isTaken}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                isTaken
                  ? "border-primary/30 bg-secondary"
                  : "border-input hover:bg-accent/40",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-14 shrink-0 items-center justify-center rounded-md text-sm font-semibold tabular-nums",
                  isTaken
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-foreground",
                )}
              >
                {dose.time}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    isTaken && "text-muted-foreground line-through",
                  )}
                >
                  {dose.name}
                </span>
                {dose.dosage && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {dose.dosage}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  isTaken
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input",
                )}
                aria-hidden
              >
                {isTaken && <Check className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
