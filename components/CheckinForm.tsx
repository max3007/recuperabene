"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  mobilityLabel,
  moodEmoji,
  painEmoji,
} from "@/lib/constants";

export type CheckinDefaults = {
  painLevel: number;
  mobility: string;
  mood: number;
  notes: string;
};

export function CheckinForm({
  defaults,
  isEditing,
  checkInId,
  dateLabel,
}: {
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Input in linguaggio naturale: interpreta → precompila → l'utente conferma.
  const [nlText, setNlText] = useState("");
  const [nlBusy, setNlBusy] = useState(false);
  const [nlError, setNlError] = useState<string | null>(null);
  const [nlRecognized, setNlRecognized] = useState<string[] | null>(null);

  const editingPast = Boolean(checkInId);

  async function interpret() {
    const text = nlText.trim();
    if (!text) return;
    setNlError(null);
    setNlRecognized(null);
    setNlBusy(true);

    const res = await fetch("/api/checkins/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    setNlBusy(false);

    if (!res.ok) {
      setNlError(data.error ?? "Interpretazione non riuscita.");
      return;
    }

    // Trascrive nel form SOLO i campi riconosciuti; gli altri restano com'erano.
    const recognized: string[] = [];
    if (data.painLevel !== null && data.painLevel !== undefined) {
      setPainLevel(data.painLevel);
      recognized.push(`dolore ${data.painLevel}/10`);
    }
    if (data.mobility) {
      setMobility(data.mobility);
      recognized.push(`mobilità "${mobilityLabel(data.mobility)}"`);
    }
    if (data.mood !== null && data.mood !== undefined) {
      setMood(data.mood);
      recognized.push(`umore ${moodEmoji(data.mood)}`);
    }
    if (data.notes) {
      setNotes(data.notes);
      recognized.push("note");
    }

    setNlRecognized(recognized);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch(
      editingPast ? `/api/checkins/${checkInId}` : "/api/checkins",
      {
        method: editingPast ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ painLevel, mobility, mood, notes }),
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
        {/* Input in linguaggio naturale: scorciatoia che precompila il form. */}
        <div className="mb-6 space-y-3 rounded-xl border border-primary/30 bg-accent/30 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Descrivi la tua giornata
            </span>
          </div>
          <Textarea
            value={nlText}
            onChange={(e) => setNlText(e.target.value)}
            placeholder="Es. «Oggi dolore sul 6, camminato un po' in giardino, umore così così»"
            rows={2}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={interpret}
            disabled={nlBusy || !nlText.trim()}
          >
            {nlBusy ? "Interpreto…" : "Interpreta e compila"}
          </Button>

          {nlError && (
            <p className="text-sm text-destructive" role="alert">
              {nlError}
            </p>
          )}

          {nlRecognized && (
            <div className="text-sm">
              {nlRecognized.length > 0 ? (
                <p>
                  Ho compilato:{" "}
                  <span className="font-medium">{nlRecognized.join(", ")}</span>
                  . Controlla e salva.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Non ho riconosciuto campi: compila il form a mano.
                </p>
              )}
            </div>
          )}
        </div>

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

          <Button type="submit" className="w-full" disabled={saving || done}>
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
