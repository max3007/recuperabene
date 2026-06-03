"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [operationType, setOperationType] = useState("");
  const [operationDate, setOperationDate] = useState("");
  const [meds, setMeds] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateMed(i: number, value: string) {
    setMeds((prev) => prev.map((m, idx) => (idx === i ? value : m)));
  }
  function addMed() {
    setMeds((prev) => [...prev, ""]);
  }
  function removeMed(i: number) {
    setMeds((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        operationType,
        operationDate,
        medications: meds,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Qualcosa è andato storto. Riprova.");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Benvenuto/a 👋</CardTitle>
        <CardDescription>
          Configuriamo insieme il tuo diario di recupero. Bastano pochi dati.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Il tuo nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Maria"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operationType">Tipo di operazione</Label>
            <Input
              id="operationType"
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              placeholder="Es. Protesi al ginocchio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operationDate">Data dell'operazione</Label>
            <Input
              id="operationDate"
              type="date"
              value={operationDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setOperationDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>I tuoi farmaci</Label>
            <p className="text-xs text-muted-foreground">
              Quelli che assumi durante il recupero. Potrai spuntarli ogni
              giorno nel check-in.
            </p>
            <div className="space-y-2">
              {meds.map((med, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={med}
                    onChange={(e) => updateMed(i, e.target.value)}
                    placeholder="Es. Paracetamolo"
                  />
                  {meds.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMed(i)}
                      aria-label="Rimuovi farmaco"
                    >
                      <X />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMed}
              className="mt-1"
            >
              <Plus /> Aggiungi farmaco
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Salvataggio…" : "Inizia"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
