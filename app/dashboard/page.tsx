import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ClipboardCheck } from "lucide-react";

import { DashboardHero } from "@/components/DashboardHero";
import { InsightsPanel } from "@/components/InsightsPanel";
import { MilestoneBanner } from "@/components/MilestoneBanner";
import { AppHeader, Nav } from "@/components/Nav";
import { RecoveryCharts, type ChartPoint } from "@/components/RecoveryCharts";
import { StatCards } from "@/components/StatCards";
import { TodayMeds } from "@/components/TodayMeds";
import { Button } from "@/components/ui/button";
import { mobilityScore } from "@/lib/constants";
import { calcStreak, daysSince, isSameLocalDay } from "@/lib/date";
import { buildTodayDoses, doseKey } from "@/lib/medications";
import { getCheckIns, getPatient, getTodayIntakes } from "@/lib/queries";

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

  const intakes = await getTodayIntakes(patient.id);
  const takenKeys = new Set(
    intakes.map((i) => doseKey(i.medicationId, i.time)),
  );
  const todayDoses = buildTodayDoses(patient.medications, takenKeys);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader subtitle={`Recupero di ${patient.name}`} />
      <main className="mx-auto w-full max-w-screen-sm flex-1 space-y-4 p-4">
        <DashboardHero name={patient.name} daysSinceOp={daysSinceOp} />

        <MilestoneBanner daysSinceOp={daysSinceOp} />

        <StatCards daysSinceOp={daysSinceOp} streak={streak} />

        {!loggedToday && (
          <Button asChild className="w-full" size="lg">
            <Link href="/checkin">
              <ClipboardCheck /> Fai il check-in di oggi
            </Link>
          </Button>
        )}

        <TodayMeds doses={todayDoses} />

        {checkIns.length > 0 ? (
          <RecoveryCharts data={chartData} />
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm leading-relaxed text-muted-foreground">
            Qui appariranno i grafici del tuo recupero. 🌱
            <br />
            Fai il primo check-in quando te la senti, senza fretta.
          </p>
        )}

        <InsightsPanel />
      </main>
      <Nav />
    </div>
  );
}
