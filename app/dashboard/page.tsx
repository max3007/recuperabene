import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ClipboardCheck } from "lucide-react";

import { InsightsPanel } from "@/components/InsightsPanel";
import { AppHeader, Nav } from "@/components/Nav";
import { RecoveryCharts, type ChartPoint } from "@/components/RecoveryCharts";
import { StatCards } from "@/components/StatCards";
import { Button } from "@/components/ui/button";
import { mobilityScore } from "@/lib/constants";
import { calcStreak, daysSince, isSameLocalDay } from "@/lib/date";
import { getCheckIns, getPatient } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const patient = await getPatient();
  if (!patient) redirect("/setup");

  const checkIns = await getCheckIns(patient.id);

  const chartData: ChartPoint[] = checkIns.map((c) => ({
    label: format(c.date, "d MMM", { locale: it }),
    pain: c.painLevel,
    mobility: mobilityScore(c.mobility),
    mood: c.mood,
  }));

  const streak = calcStreak(checkIns.map((c) => c.date));
  const daysSinceOp = daysSince(patient.operationDate);
  const loggedToday = checkIns.some((c) => isSameLocalDay(c.date, new Date()));

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader subtitle={`Recupero di ${patient.name}`} />
      <main className="mx-auto w-full max-w-screen-sm flex-1 space-y-4 p-4">
        <StatCards daysSinceOp={daysSinceOp} streak={streak} />

        {!loggedToday && (
          <Button asChild className="w-full" size="lg">
            <Link href="/checkin">
              <ClipboardCheck /> Fai il check-in di oggi
            </Link>
          </Button>
        )}

        {checkIns.length > 0 ? (
          <RecoveryCharts data={chartData} />
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nessun dato ancora. Fai il tuo primo check-in per vedere i grafici.
          </p>
        )}

        <InsightsPanel />
      </main>
      <Nav />
    </div>
  );
}
