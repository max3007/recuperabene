"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Check,
  Clock,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseTimes } from "@/lib/medications";

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  times: string;
  asNeeded: boolean;
  active: boolean;
  startDate: string | Date | null;
  durationDays: number | null;
};

type Draft = {
  name: string;
  dosage: string;
  asNeeded: boolean;
  times: string;
  startDate: string;
  durationDays: string;
};

const emptyDraft: Draft = {
  name: "",
  dosage: "",
  asNeeded: false,
  times: "",
  startDate: "",
  durationDays: "",
};

function toDateInput(d: string | Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function draftToBody(d: Draft) {
  return {
    name: d.name.trim(),
    dosage: d.dosage,
    asNeeded: d.asNeeded,
    times: d.times,
    startDate: d.startDate || null,
    durationDays: d.durationDays ? Number(d.durationDays) : null,
  };
}

function periodLabel(med: Medication): string | null {
  if (!med.startDate) return null;
  const start = new Date(med.startDate).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
  return med.durationDays
    ? `dal ${start} · ${med.durationDays} gg`
    : `dal ${start}`;
}

export function MedicationsManager({
  medications,
}: {
  medications: Medication[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Draft>(emptyDraft);

  const active = medications.filter((m) => m.active);
  const archived = medications.filter((m) => !m.active);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setError(null);
    setBusy(true);
    const res = await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftToBody(draft)),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Impossibile aggiungere il farmaco.");
      return;
    }
    setDraft(emptyDraft);
    router.refresh();
  }

  async function save(id: string) {
    if (!edit.name.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/medications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftToBody(edit)),
    });
    setBusy(false);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function setActive(id: string, value: boolean) {
    setBusy(true);
    await fetch(`/api/medications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: value }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove(id: string, name: string) {
    if (
      !window.confirm(
        `Eliminare definitivamente "${name}"? Si perde anche lo storico delle dosi. Per sospenderlo senza perdere i dati, usa "Archivia".`,
      )
    ) {
      return;
    }
    setBusy(true);
    await fetch(`/api/medications/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  function startEdit(med: Medication) {
    setEditingId(med.id);
    setEdit({
      name: med.name,
      dosage: med.dosage ?? "",
      asNeeded: med.asNeeded,
      times: parseTimes(med.times).join(", "),
      startDate: toDateInput(med.startDate),
      durationDays: med.durationDays ? String(med.durationDays) : "",
    });
  }

  function DraftFields({
    value,
    onChange,
  }: {
    value: Draft;
    onChange: (d: Draft) => void;
  }) {
    return (
      <div className="space-y-2">
        <Input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Nome"
          className="h-9"
        />
        <Input
          value={value.dosage}
          onChange={(e) => onChange({ ...value, dosage: e.target.value })}
          placeholder="Dose, es. 1 compressa (facoltativo)"
          className="h-9"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={value.asNeeded}
            onCheckedChange={(c) =>
              onChange({ ...value, asNeeded: c === true })
            }
          />
          Al bisogno (senza orari fissi)
        </label>
        {!value.asNeeded && (
          <Input
            value={value.times}
            onChange={(e) => onChange({ ...value, times: e.target.value })}
            placeholder="Orari, es. 08:00, 20:00"
            className="h-9"
          />
        )}
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Inizio</Label>
            <Input
              type="date"
              value={value.startDate}
              onChange={(e) =>
                onChange({ ...value, startDate: e.target.value })
              }
              className="h-9"
            />
          </div>
          <div className="w-28 space-y-1">
            <Label className="text-xs text-muted-foreground">Durata (gg)</Label>
            <Input
              type="number"
              min={1}
              value={value.durationDays}
              onChange={(e) =>
                onChange({ ...value, durationDays: e.target.value })
              }
              placeholder="∞"
              className="h-9"
            />
          </div>
        </div>
      </div>
    );
  }

  function MedRow({ med }: { med: Medication }) {
    const times = parseTimes(med.times);
    const period = periodLabel(med);
    return (
      <li className="rounded-lg border border-input p-2 pl-3">
        {editingId === med.id ? (
          <div className="space-y-2">
            <DraftFields value={edit} onChange={setEdit} />
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(null)}
              >
                <X /> Annulla
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => save(med.id)}
              >
                <Check /> Salva
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {med.name}
                {med.dosage && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {med.dosage}
                  </span>
                )}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {med.asNeeded ? (
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> al bisogno
                  </span>
                ) : (
                  times.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {times.join(" · ")}
                    </span>
                  )
                )}
                {period && <span>{period}</span>}
              </p>
            </div>
            {med.active ? (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => startEdit(med)}
                  aria-label="Modifica"
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={busy}
                  onClick={() => setActive(med.id, false)}
                  aria-label="Archivia"
                  title="Archivia (sospendi senza perdere lo storico)"
                >
                  <Archive />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={busy}
                onClick={() => setActive(med.id, true)}
                aria-label="Ripristina"
                title="Ripristina"
              >
                <ArchiveRestore />
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              disabled={busy}
              onClick={() => remove(med.id, med.name)}
              aria-label="Elimina"
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </li>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Farmaci</CardTitle>
        <CardDescription>
          Dose, orari e durata compaiono in &quot;Farmaci di oggi&quot; sulla
          dashboard. &quot;Al bisogno&quot; per i farmaci senza orario fisso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {active.map((med) => (
            <MedRow key={med.id} med={med} />
          ))}
          {active.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nessun farmaco attivo. Aggiungine uno qui sotto.
            </li>
          )}
        </ul>

        {archived.length > 0 && (
          <details className="rounded-lg border border-dashed">
            <summary className="cursor-pointer p-2 pl-3 text-sm text-muted-foreground">
              Archiviati ({archived.length})
            </summary>
            <ul className="space-y-2 p-2 pt-0">
              {archived.map((med) => (
                <MedRow key={med.id} med={med} />
              ))}
            </ul>
          </details>
        )}

        <form onSubmit={add} className="space-y-2 border-t pt-3">
          <DraftFields value={draft} onChange={setDraft} />
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={busy}
          >
            <Plus /> Aggiungi farmaco
          </Button>
        </form>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
