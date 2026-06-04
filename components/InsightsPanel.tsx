"use client";

import { useState } from "react";
import {
  Sparkles,
  Lightbulb,
  Stethoscope,
  TrendingUp,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Insights } from "@/lib/insights";
import { downloadInsightsPdf } from "@/lib/insights-pdf";

export function InsightsPanel({
  patientName,
  daysSinceOp,
}: {
  patientName?: string;
  daysSinceOp?: number;
}) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analisi non riuscita.");
        return;
      }
      const result = data as Insights;
      const now = new Date();
      setInsights(result);
      setGeneratedAt(now);
      // Scarica automaticamente il PDF appena l'analisi è pronta.
      void downloadInsightsPdf(result, {
        patientName,
        daysSinceOp,
        date: now,
      });
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-b from-accent/40 to-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          Analisi del recupero
        </CardTitle>
        <CardDescription>
          Un riassunto del tuo andamento generato dall&apos;AI, in italiano.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={analyze} disabled={loading} className="w-full">
          {loading ? "Sto analizzando…" : "Analizza il mio recupero"}
        </Button>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {insights && (
          <div className="space-y-5 pt-1">
            <p className="text-sm leading-relaxed">{insights.summary}</p>

            <InsightSection
              icon={<TrendingUp className="h-4 w-4" />}
              title="Pattern osservati"
              items={insights.patterns}
            />
            <InsightSection
              icon={<Lightbulb className="h-4 w-4" />}
              title="Suggerimenti"
              items={insights.suggestions}
            />
            <InsightSection
              icon={<Stethoscope className="h-4 w-4" />}
              title="Da chiedere al medico"
              items={insights.doctorQuestions}
            />

            <p className="text-xs text-muted-foreground">
              Questi spunti non sostituiscono il parere del tuo medico.
            </p>

            {generatedAt && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  void downloadInsightsPdf(insights, {
                    patientName,
                    daysSinceOp,
                    date: generatedAt,
                  })
                }
              >
                <Download /> Scarica il PDF
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
        {icon}
        {title}
      </h3>
      <ul className="list-disc space-y-1 pl-6 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
