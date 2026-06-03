import { redirect } from "next/navigation";

import { getPatient } from "@/lib/queries";

// Router d'ingresso: primo avvio → setup, altrimenti → dashboard.
export default async function Home() {
  const patient = await getPatient();
  redirect(patient ? "/dashboard" : "/setup");
}
