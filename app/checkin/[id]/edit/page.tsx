import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { CheckinForm, type CheckinDefaults } from "@/components/CheckinForm";
import { AppHeader, Nav } from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { getPatient } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditCheckinPage({
  params,
}: {
  params: { id: string };
}) {
  const patient = await getPatient();
  if (!patient) redirect("/setup");

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: params.id },
    include: { medications: true },
  });
  if (!checkIn || checkIn.patientId !== patient.id) notFound();

  const defaults: CheckinDefaults = {
    painLevel: checkIn.painLevel,
    mobility: checkIn.mobility,
    mood: checkIn.mood,
    notes: checkIn.notes,
    medicationIds: checkIn.medications.map((m) => m.id),
  };
  const dateLabel = format(checkIn.date, "EEEE d MMMM", { locale: it });

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader subtitle="Modifica check-in" />
      <main className="mx-auto w-full max-w-screen-sm flex-1 p-4">
        <CheckinForm
          medications={patient.medications}
          defaults={defaults}
          isEditing
          checkInId={checkIn.id}
          dateLabel={dateLabel}
        />
      </main>
      <Nav />
    </div>
  );
}
