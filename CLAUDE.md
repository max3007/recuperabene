# CLAUDE.md — RecuperaBene

## Cos'è questo progetto

Tracker personale post-operatorio: il paziente registra un check-in al giorno
(dolore, mobilità, farmaci, umore, note) e vede l'andamento del recupero su una
dashboard, con insight generati da Claude.

- **Stato**: WIP / greenfield (scaffold da creare).
- **Utenti**: un singolo paziente (uso personale, locale).
- **Vincoli**: nessun servizio esterno per i dati — DB locale SQLite. UI **tutta in italiano**.
  L'unica chiamata di rete è verso l'API Anthropic per gli insight.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** + **SQLite** (file locale, niente DB remoto)
- **Tailwind CSS** + **shadcn/ui**
- **Recharts** per i grafici
- **Anthropic Claude API** — insight su `claude-sonnet-4-6`; parsing del check-in in
  linguaggio naturale su `claude-haiku-4-5` (task leggero → modello veloce/economico)
- Package manager: **pnpm**

## Architettura in 60 secondi

Flusso principale:

1. **Setup** (primo avvio): se non esiste un `Patient`, mostra il form di setup
   (nome, tipo operazione, data, lista farmaci) → salva su DB.
2. **Check-in giornaliero**: form → API route → upsert del `CheckIn` del giorno
   (uno per data, editabile fino a mezzanotte).
3. **Dashboard**: legge i check-in dal DB → grafici Recharts (dolore, mobilità,
   umore, streak, giorni dall'operazione).
4. **AI Insights**: bottone "Analizza il mio recupero" → API route che invia gli
   ultimi 7 check-in a Claude → risposta in italiano.
5. **Check-in in linguaggio naturale**: nel form, una frase libera →
   `POST /api/checkins/parse` (Haiku, structured output) → **precompila** i campi
   riconosciuti. L'endpoint **non scrive sul DB**: l'utente rivede e salva col path
   normale (`interpreta → rivedi → conferma`). I farmaci sono mappati per nome agli
   id del profilo; quelli sconosciuti sono solo segnalati, mai creati.

Confini chiave:

- I **Server Component / page** non chiamano l'API Anthropic direttamente: passano
  per una **route handler** server-side (`app/api/...`) che è l'unica a vedere la
  API key.
- La **API key Anthropic** sta in env-var (`ANTHROPIC_API_KEY`), mai nel client,
  mai committata.
- L'accesso al DB passa **solo** da Prisma client server-side, mai dal browser.

## Dove vivono le cose

> Mappa target dello scaffold (da creare).

- `app/` — route App Router
  - `app/setup/` — schermata di setup iniziale
  - `app/checkin/` — form check-in giornaliero
  - `app/dashboard/` — grafici e metriche
  - `app/history/` — storico check-in espandibili
  - `app/api/checkins/` — CRUD check-in
  - `app/api/insights/` — integrazione Claude
- `components/` — componenti UI (inclusi quelli di shadcn/ui in `components/ui/`)
- `lib/` — helper (Prisma client, client Anthropic, utility date/streak)
- `prisma/` — `schema.prisma`, migration, `seed.ts` (5 giorni di check-in di esempio)
- `deploy/` — config per il path VM (`Caddyfile`, systemd unit, `backup.sh`).
- `middleware.ts` — Basic Auth perimetrale (produzione Vercel; vedi nota auth sotto).
- Deploy: vedi [DEPLOY.md](DEPLOY.md). **Opzione A (attuale)**: Vercel + Turso (libSQL).
  **Opzione B**: EC2 free-tier + Caddy.

## Convenzioni di nomi

- File componenti: `PascalCase.tsx`; route App Router: cartelle lowercase con `page.tsx`.
- Helper/lib: `camelCase.ts`.
- Stringhe: virgolette doppie.
- Lingua: codice/commenti/commit in **inglese**, UI e testi utente in **italiano**.

## Test: cosa ci aspettiamo

[TODO: framework di test non ancora scelto. Candidati: Vitest + Testing Library per
i componenti, Playwright per E2E. Da decidere e poi documentare comando + dove vivono.]

## Cose che il tuo "io futuro" dimenticherà

- **Un check-in per giorno, editabile fino a mezzanotte**: l'API deve fare *upsert*
  sulla data odierna, non *create* cieco, e rifiutare/redirigere la modifica di
  giorni passati.
- **Streak**: si conta sui giorni *consecutivi* loggati — attenzione ai fusi orari e
  al confine di mezzanotte (usa la data locale, non UTC, per il "giorno").
- **SQLite + Prisma**: gli enum nativi non sono supportati su SQLite. Mobilità/umore
  vanno modellati come `String` (o `Int`) con validazione lato app, non come `enum`
  Prisma.
- **Modello Claude**: `claude-sonnet-4-6`, definito in un solo punto (`INSIGHTS_MODEL`
  in [lib/anthropic.ts](lib/anthropic.ts)). Supporta gli **structured outputs nativi**:
  l'analisi è vincolata via `output_config.format` + JSON schema (`INSIGHTS_SCHEMA`),
  non via prompt-and-pray. Se torni a un modello più vecchio (es. Sonnet 4.0) gli
  structured outputs non esistono: usa una forced tool call.
- **Prompt insight in italiano**: la risposta deve essere in italiano e con tono
  rassicurante; imposto nel system prompt (`INSIGHTS_SYSTEM_PROMPT`), non sperato.
- **Prompt caching**: il system prompt è stabile e marcato `cache_control`; i check-in
  (volatili) stanno nel messaggio utente, dopo il prefisso cacheabile.
- **Farmaci — unica fonte di verità = `MedicationIntake`** (una riga per farmaco/giorno/orario
  = dose presa). Il check-in **non** registra più i farmaci: la relazione `CheckIn.medications`
  resta nello schema solo per i dati vecchi, **non si scrive più**. Lo storico ricava i farmaci
  del giorno dagli intake ([getMedNamesByDay](lib/queries.ts)). Il modello `Medication` ha
  `asNeeded` (al bisogno/PRN), `active` (archiviazione soft: si **archivia**, non si cancella),
  `startDate`+`durationDays` (un farmaco appare in "Farmaci di oggi" solo finché la terapia è in
  corso — vedi [isMedActiveOn](lib/medications.ts)). Dose PRN registrata all'ora corrente IT.
- **Autenticazione**: in **locale** le route non hanno auth (design mono-paziente). In
  **produzione** la protezione è **obbligatoria** ed è implementata in [middleware.ts](middleware.ts):
  Basic Auth su tutte le route, credenziali da env (`BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD`),
  **fail-closed** (se mancano, in produzione blocca tutto). Sostituisce il Basic Auth di Caddy
  del path VM. Resta single-secret, non per-utente: **se diventa multi-utente serve auth
  applicativa con scoping per paziente** (es. next-auth).
  - **Endpoint AI = vettore costi**: `/api/insights` e `/api/checkins/parse` chiamano
    Claude (spesa per richiesta). Hanno un **rate limit per IP** ([lib/rate-limit.ts](lib/rate-limit.ts)),
    best-effort in memoria: difesa in profondità, non un limite distribuito forte (su
    serverless lo stato è per-istanza). La protezione vera resta il Basic Auth.
  - **DB in produzione**: file SQLite non persiste su Vercel (FS effimero) → si usa **Turso**
    (libSQL). [lib/prisma.ts](lib/prisma.ts) sceglie l'adapter libSQL se `TURSO_DATABASE_URL`
    è presente, altrimenti il file locale. Le migration vanno applicate a Turso **a mano**
    (`turso db shell ... < migration.sql`): Prisma Migrate non parla con libSQL.

## Cosa NON fare in questo repo

- Non chiamare l'API Anthropic da un client component né esporre `ANTHROPIC_API_KEY`
  al browser.
- Non committare `.env`, la API key, o il file `.db` di SQLite con dati reali.
- Non usare `enum` Prisma con SQLite (vedi sopra).
- Non duplicare la logica di accesso DB: un solo Prisma client condiviso in `lib/`.

## Comandi che uso spesso

> Da confermare dopo lo scaffold (dipendono dagli `scripts` in package.json).

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — build e avvio produzione
- `pnpm prisma migrate dev` — applica/crea migration in locale
- `pnpm prisma db seed` — popola i 5 giorni di check-in di esempio
- `pnpm prisma studio` — ispeziona il DB
