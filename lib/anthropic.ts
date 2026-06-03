import Anthropic from "@anthropic-ai/sdk";

// Client Anthropic server-side. La API key vive SOLO qui (env-var), mai nel client.
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY non configurata. Aggiungila al file .env.",
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Modello usato per gli insight. Cambialo qui in un solo punto se aggiorni.
// Sonnet 4.6 supporta gli structured outputs nativi (output_config.format).
export const INSIGHTS_MODEL = "claude-sonnet-4-6";
