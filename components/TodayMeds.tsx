"use client";

import { useState } from "react";
import { Check, Minus, Pill, Plus, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { doseKey, type Dose, type PrnMed } from "@/lib/medications";

// Checklist "Farmaci di oggi": dosi programmate (spunta per orario) e farmaci
// al bisogno (presa ora / annulla ultima). Stato ottimistico locale.
export function TodayMeds({
  doses,
  prnMeds,
}: {
  doses: Dose[];
  prnMeds: PrnMed[];
}) {
  const [taken, setTaken] = useState<Set<string>>(
    () =>
      new Set(
        doses.filter((d) => d.taken).map((d) => doseKey(d.medicationId, d.time)),
      ),
  );
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(prnMeds.map((m) => [m.medicationId, m.takenCount])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  if (doses.length === 0 && prnMeds.length === 0) return null;

  async function toggleDose(dose: Dose) {
    const key = doseKey(dose.medicationId, dose.time);
    const next = !taken.has(key);
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
      setTaken((prev) => {
        const s = new Set(prev);
        if (next) s.delete(key);
        else s.add(key);
        return s;
      });
    }
  }

  async function prn(medicationId: string, take: boolean) {
    const key = `prn:${medicationId}`;
    setCounts((prev) => ({
      ...prev,
      [medicationId]: Math.max(0, (prev[medicationId] ?? 0) + (take ? 1 : -1)),
    }));
    setBusy(key);
    const res = await fetch("/api/medications/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicationId, prn: true, taken: take }),
    }).catch(() => null);
    setBusy(null);
    if (!res || !res.ok) {
      setCounts((prev) => ({
        ...prev,
        [medicationId]: Math.max(0, (prev[medicationId] ?? 0) + (take ? -1 : 1)),
      }));
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
        {doses.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {doneCount}/{doses.length} prese
          </span>
        )}
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
              onClick={() => toggleDose(dose)}
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

        {prnMeds.length > 0 && (
          <div className="space-y-2 pt-1">
            {doses.length > 0 && (
              <p className="flex items-center gap-1 pt-1 text-xs font-medium text-muted-foreground">
                <Repeat className="h-3 w-3" /> Al bisogno
              </p>
            )}
            {prnMeds.map((med) => {
              const count = counts[med.medicationId] ?? 0;
              const key = `prn:${med.medicationId}`;
              return (
                <div
                  key={med.medicationId}
                  className="flex items-center gap-3 rounded-lg border border-input p-2.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {med.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {count > 0
                        ? `preso ${count} ${count === 1 ? "volta" : "volte"} oggi`
                        : med.dosage
                          ? med.dosage
                          : "al bisogno"}
                    </span>
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={busy === key || count === 0}
                    onClick={() => prn(med.medicationId, false)}
                    aria-label="Annulla ultima"
                  >
                    <Minus />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy === key}
                    onClick={() => prn(med.medicationId, true)}
                  >
                    <Plus /> Presa
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
