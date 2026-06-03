"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResetData() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (
      !window.confirm(
        "Vuoi davvero cancellare TUTTI i dati (profilo, farmaci e check-in)? L'azione è irreversibile.",
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch("/api/reset", { method: "POST" });
    if (!res.ok) {
      setBusy(false);
      return;
    }
    // Tornati allo stato iniziale: vai al setup.
    router.push("/setup");
    router.refresh();
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Ricomincia da capo
        </CardTitle>
        <CardDescription>
          Cancella tutti i dati e torna alla schermata di setup per inserire un
          nuovo profilo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={reset}
        >
          {busy ? "Cancellazione…" : "Cancella tutti i dati"}
        </Button>
      </CardContent>
    </Card>
  );
}
