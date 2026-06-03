"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MOBILITY_OPTIONS,
  MOOD_OPTIONS,
  painEmoji,
} from "@/lib/constants";

type Medication = { id: string; name: string };

export type CheckinDefaults = {
  painLevel: number;
  mobility: string;
  mood: number;
  notes: string;
  medicationIds: string[];
};

export function CheckinForm({
  medications,
  defaults,
  isEditing,
  checkInId,
  dateLabel,
}: {
  medications: Medication[];
  defaults: CheckinDefaults;
  isEditing: boolean;
  // Se presente, il form modifica QUEL check-in (PATCH) invece di fare
  // l'upsert di oggi (POST). Usato dallo storico per editare i giorni passati.
  checkInId?: string;
  dateLabel?: string;
}) {
  const router = useRouter();
  const [painLevel, setPainLevel] = useState(defaults.painLevel);
  const [mobility, setMobility] = useState(defaults.mobility);
  const [mood, setMood] = useState(defaults.mood);
  const [notes, setNotes] = useState(defaults.notes);
  const [medicationIds, setMedicationIds] = useState<string[]>(
    defaults.medicationIds,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggleMed(id: string, checked: boolean) {
    setMedicationIds((prev) =>
      checked ? [...prev, id] : prev.filter((m) => m !== id),
    );
  }

  const editingPast = Boolean(checkInId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch(
      editingPast ? `/api/checkins/${checkInId}` : "/api/checkins",
      {
        method: editingPast ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ painLevel, mobility, mood, notes, medicationIds }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Salvataggio non riuscito. Riprova.");
      setSaving(false);
      return;
    }

    setDone(true);
    setSaving(false);
    router.refresh();
    setTimeout(() => router.push(editingPast ? "/history" : "/dashboard"), 900);
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">
          {editingPast ? "Modifica check-in" : "Check-in di oggi"}
        </CardTitle>
        <CardDescription>
          {editingPast
            ? `Stai modificando il check-in di ${dateLabel ?? "un giorno passato"}.`
            : isEditing
              ? "Hai già registrato oggi: puoi modificare fino a mezzanotte."
              : "Come ti senti? Rispondi con calma, ci vuole un minuto."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Dolore */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Livello di dolore</Label>
              <span className="text-2xl" aria-hidden>
                {painEmoji(painLevel)}
              </span>
            </div>
            <Slider
              value={[painLevel]}
              onValueChange={(v) => setPainLevel(v[0])}
              min={0}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nessun dolore</span>
              <span className="font-semibold text-foreground">
                {painLevel}/10
              </span>
              <span>Massimo</span>
            </div>
          </div>

          {/* Mobilità */}
          <div className="space-y-2">
            <Label>Mobilità</Label>
            <Select value={mobility} onValueChange={setMobility}>
              <SelectTrigger>
                <SelectValue placeholder="Come ti muovi oggi?" />
              </SelectTrigger>
              <SelectContent>
                {MOBILITY_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Umore */}
          <div className="space-y-2">
            <Label>Umore</Label>
            <div className="flex justify-between gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  aria-label={m.label}
                  aria-pressed={mood === m.value}
                  className={cn(
                    "flex h-14 flex-1 items-center justify-center rounded-lg border text-3xl transition-all",
                    mood === m.value
                      ? "scale-105 border-primary bg-accent"
                      : "border-input opacity-60 hover:opacity-100",
                  )}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Farmaci */}
          {medications.length > 0 && (
            <div className="space-y-3">
              <Label>Farmaci assunti oggi</Label>
              <div className="space-y-2">
                {medications.map((med) => (
                  <label
                    key={med.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-input p-3"
                  >
                    <Checkbox
                      checked={medicationIds.includes(med.id)}
                      onCheckedChange={(c) => toggleMed(med.id, c === true)}
                    />
                    <span className="text-sm">{med.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="notes">Note libere</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Come è andata la giornata? Qualcosa da ricordare?"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={saving || done}
          >
            {done
              ? "Salvato ✓"
              : saving
                ? "Salvataggio…"
                : editingPast || isEditing
                  ? "Aggiorna check-in"
                  : "Salva check-in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
