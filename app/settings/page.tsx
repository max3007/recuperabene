import { redirect } from "next/navigation";
import { format } from "date-fns";

import { MedicationsManager } from "@/components/MedicationsManager";
import { AppHeader, Nav } from "@/components/Nav";
import { ProfileForm } from "@/components/ProfileForm";
import { ResetData } from "@/components/ResetData";
import { getPatient } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const patient = await getPatient();
  if (!patient) redirect("/setup");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader subtitle="Impostazioni" />
      <main className="mx-auto w-full max-w-screen-sm flex-1 space-y-4 p-4">
        <h1 className="text-lg font-semibold">Impostazioni</h1>
        <ProfileForm
          initialName={patient.name}
          initialOperationType={patient.operationType}
          initialOperationDate={format(patient.operationDate, "yyyy-MM-dd")}
        />
        <MedicationsManager medications={patient.medications} />
        <ResetData />
      </main>
      <Nav />
    </div>
  );
}
