"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  mobilityLabel,
  moodEmoji,
  moodLabel,
  painEmoji,
} from "@/lib/constants";

export type HistoryEntry = {
  id: string;
  dateLabel: string;
  painLevel: number;
  mobility: string;
  mood: number;
  notes: string;
  medications: string[];
};

export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nessun check-in registrato finora.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <HistoryItem key={e.id} entry={e} />
      ))}
    </div>
  );
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl" aria-hidden>
          {moodEmoji(entry.mood)}
        </span>
        <div className="flex-1">
          <p className="font-medium capitalize">{entry.dateLabel}</p>
          <p className="text-xs text-muted-foreground">
            Dolore {entry.painLevel}/10 · {mobilityLabel(entry.mobility)}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <CardContent className="space-y-3 border-t pt-4 text-sm">
          <Detail label="Dolore">
            {painEmoji(entry.painLevel)} {entry.painLevel}/10
          </Detail>
          <Detail label="Mobilità">{mobilityLabel(entry.mobility)}</Detail>
          <Detail label="Umore">
            {moodEmoji(entry.mood)} {moodLabel(entry.mood)}
          </Detail>
          <Detail label="Farmaci">
            {entry.medications.length > 0
              ? entry.medications.join(", ")
              : "nessuno"}
          </Detail>
          {entry.notes.trim() && (
            <Detail label="Note">{entry.notes}</Detail>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 font-medium text-muted-foreground">
        {label}
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
