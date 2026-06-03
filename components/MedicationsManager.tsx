"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Medication = { id: string; name: string };

export function MedicationsManager({
  medications,
}: {
  medications: Medication[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    setBusy(true);
    const res = await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Impossibile aggiungere il farmaco.");
      return;
    }
    setNewName("");
    router.refresh();
  }

  async function rename(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setBusy(true);
    const res = await fetch(`/api/medications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
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
          Quelli che spunti nel check-in giornaliero.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {medications.map((med) => (
            <li
              key={med.id}
              className="flex items-center gap-2 rounded-lg border border-input p-2 pl-3"
            >
              {editingId === med.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={busy}
                    onClick={() => rename(med.id)}
                    aria-label="Conferma"
                  >
                    <Check />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditingId(null)}
                    aria-label="Annulla"
                  >
                    <X />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{med.name}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingId(med.id);
                      setEditingName(med.name);
                    }}
                    aria-label="Rinomina"
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
                </>
              )}
            </li>
          ))}
          {medications.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nessun farmaco. Aggiungine uno qui sotto.
            </li>
          )}
        </ul>

        <form onSubmit={add} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nuovo farmaco"
          />
          <Button type="submit" variant="outline" disabled={busy}>
            <Plus /> Aggiungi
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
