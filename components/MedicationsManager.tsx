"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Clock, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseTimes } from "@/lib/medications";

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  times: string;
};

const emptyDraft = { name: "", dosage: "", times: "" };

export function MedicationsManager({
  medications,
}: {
  medications: Medication[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState(emptyDraft);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) return;
    setError(null);
    setBusy(true);
    const res = await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        dosage: draft.dosage,
        times: draft.times,
      }),
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
    const name = edit.name.trim();
    if (!name) return;
    setBusy(true);
    const res = await fetch(`/api/medications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, dosage: edit.dosage, times: edit.times }),
    });
    setBusy(false);
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function remove(id: string, name: string) {
    if (
      !window.confirm(
        `Eliminare "${name}"? Verrà rimosso anche dai check-in passati in cui era segnato.`,
      )
    ) {
      return;
    }
    setBusy(true);
    await fetch(`/api/medications/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Farmaci</CardTitle>
        <CardDescription>
          Dose e orari compaiono in &quot;Farmaci di oggi&quot; sulla dashboard.
          Lascia gli orari vuoti per i farmaci al bisogno.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {medications.map((med) => {
            const times = parseTimes(med.times);
            return (
              <li
                key={med.id}
                className="rounded-lg border border-input p-2 pl-3"
              >
                {editingId === med.id ? (
                  <div className="space-y-2">
                    <Input
                      value={edit.name}
                      onChange={(e) =>
                        setEdit((d) => ({ ...d, name: e.target.value }))
                      }
                      placeholder="Nome"
                      className="h-9"
                      autoFocus
                    />
                    <Input
                      value={edit.dosage}
                      onChange={(e) =>
                        setEdit((d) => ({ ...d, dosage: e.target.value }))
                      }
                      placeholder="Dose, es. 1 compressa (facoltativo)"
                      className="h-9"
                    />
                    <Input
                      value={edit.times}
                      onChange={(e) =>
                        setEdit((d) => ({ ...d, times: e.target.value }))
                      }
                      placeholder="Orari, es. 08:00, 20:00 (facoltativo)"
                      className="h-9"
                    />
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
                      {times.length > 0 && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {times.join(" · ")}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(med.id);
                        setEdit({
                          name: med.name,
                          dosage: med.dosage ?? "",
                          times: parseTimes(med.times).join(", "),
                        });
                      }}
                      aria-label="Modifica"
                    >
                      <Pencil />
                    </Button>
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
          })}
          {medications.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nessun farmaco. Aggiungine uno qui sotto.
            </li>
          )}
        </ul>

        <form onSubmit={add} className="space-y-2 border-t pt-3">
          <Input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Nuovo farmaco"
          />
          <div className="flex gap-2">
            <Input
              value={draft.dosage}
              onChange={(e) =>
                setDraft((d) => ({ ...d, dosage: e.target.value }))
              }
              placeholder="Dose (facoltativo)"
            />
            <Input
              value={draft.times}
              onChange={(e) =>
                setDraft((d) => ({ ...d, times: e.target.value }))
              }
              placeholder="Orari, es. 08:00, 20:00"
            />
          </div>
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
