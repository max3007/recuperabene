import { redirect } from "next/navigation";

import { SetupForm } from "@/components/SetupForm";
import { getPatient } from "@/lib/queries";

export default async function SetupPage() {
  const patient = await getPatient();
  if (patient) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <SetupForm />
    </main>
  );
}
