import { redirect } from "next/navigation";

import { CheckinForm, type CheckinDefaults } from "@/components/CheckinForm";
import { AppHeader, Nav } from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { getPatient } from "@/lib/queries";
import { startOfLocalDay } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const patient = await getPatient();
  if (!patient) redirect("/setup");

  const today = startOfLocalDay();
  const existing = await prisma.checkIn.findUnique({
    where: { patientId_date: { patientId: patient.id, date: today } },
    include: { medications: true },
  });

  const defaults: CheckinDefaults = existing
    ? {
        painLevel: existing.painLevel,
        mobility: existing.mobility,
        mood: existing.mood,
        notes: existing.notes,
        medicationIds: existing.medications.map((m) => m.id),
      }
    : {
        painLevel: 3,
        mobility: "indoors",
        mood: 3,
        notes: "",
        medicationIds: patient.medications.map((m) => m.id),
      };

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader subtitle={`Ciao ${patient.name}`} />
      <main className="mx-auto w-full max-w-screen-sm flex-1 p-4">
        <CheckinForm
          medications={patient.medications}
          defaults={defaults}
          isEditing={Boolean(existing)}
        />
      </main>
      <Nav />
    </div>
  );
}
