import { redirect } from "next/navigation";

import { getPatient } from "@/lib/queries";

// Legge lo stato del paziente dal DB ad ogni richiesta: senza questo, Next
// prerenderizza la pagina al build (quando il paziente non esiste ancora) e
// "congela" il redirect verso /setup per tutti.
export const dynamic = "force-dynamic";

// Router d'ingresso: primo avvio → setup, altrimenti → dashboard.
export default async function Home() {
  const patient = await getPatient();
  redirect(patient ? "/dashboard" : "/setup");
}
