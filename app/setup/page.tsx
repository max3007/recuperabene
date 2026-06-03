import { redirect } from "next/navigation";

import { SetupForm } from "@/components/SetupForm";
import { getPatient } from "@/lib/queries";

// Controlla l'esistenza del paziente ad ogni richiesta (non al build), altrimenti
// la pagina resta statica e mostra il form anche a chi ha già fatto il setup.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const patient = await getPatient();
  if (patient) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <SetupForm />
    </main>
  );
}
