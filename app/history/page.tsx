import { redirect } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { HistoryList, type HistoryEntry } from "@/components/HistoryList";
import { AppHeader, Nav } from "@/components/Nav";
import { getCheckIns, getMedNamesByDay, getPatient } from "@/lib/queries";
import { startOfLocalDay } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const patient = await getPatient();
  if (!patient) redirect("/setup");

  const checkIns = await getCheckIns(patient.id);
  // Farmaci presi per giorno, derivati dalle dosi registrate (unica fonte).
  const medNamesByDay = await getMedNamesByDay(patient.id);
  // Più recenti in cima.
  const entries: HistoryEntry[] = [...checkIns].reverse().map((c) => ({
    id: c.id,
    dateLabel: format(c.date, "EEEE d MMMM yyyy", { locale: it }),
    painLevel: c.painLevel,
    mobility: c.mobility,
    mood: c.mood,
    notes: c.notes,
    medications: medNamesByDay.get(startOfLocalDay(c.date).getTime()) ?? [],
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader subtitle="Storico check-in" />
      <main className="mx-auto w-full max-w-screen-sm flex-1 space-y-4 p-4">
        <h1 className="text-lg font-semibold">I tuoi check-in</h1>
        <HistoryList entries={entries} />
      </main>
      <Nav />
    </div>
  );
}
