import { PrismaClient } from "@prisma/client";
// Variante "web" (fetch-based, niente binari nativi): adatta al serverless e
// alla connessione remota a Turso (libsql://). Non supporta i file: locali, ma
// in locale non istanziamo l'adapter (usiamo il file SQLite via Prisma).
import { PrismaLibSQL } from "@prisma/adapter-libsql/web";

// Singleton: evita di esaurire le connessioni in dev con l'hot reload di Next.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const log =
  process.env.NODE_ENV === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);

function createPrisma(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    // Produzione (Vercel): il DB vive su Turso (libSQL). Il filesystem
    // serverless è effimero, quindi niente file SQLite locale.
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter, log: [...log] });
  }
  // Sviluppo locale: file SQLite via DATABASE_URL (risolto da Prisma
  // relativamente alla cartella prisma/).
  return new PrismaClient({ log: [...log] });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
