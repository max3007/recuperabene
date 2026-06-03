"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  initialName,
  initialOperationType,
  initialOperationDate, // formato yyyy-MM-dd
}: {
  initialName: string;
  initialOperationType: string;
  initialOperationDate: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [operationType, setOperationType] = useState(initialOperationType);
  const [operationDate, setOperationDate] = useState(initialOperationDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const res = await fetch("/api/patient", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, operationType, operationDate }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Salvataggio non riuscito.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Profilo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operationType">Tipo di operazione</Label>
            <Input
              id="operationType"
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operationDate">Data dell&apos;operazione</Label>
            <Input
              id="operationDate"
              type="date"
              value={operationDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setOperationDate(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {saved && <p className="text-sm text-primary">Profilo aggiornato ✓</p>}

          <Button type="submit" disabled={saving}>
            {saving ? "Salvataggio…" : "Salva profilo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
