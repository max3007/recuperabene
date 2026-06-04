import type { Insights } from "@/lib/insights";

type RGB = [number, number, number];

// Palette coordinata con il tema "medical-but-warm" dell'app.
const CREAM: RGB = [251, 248, 244];
const TEAL: RGB = [13, 148, 136];
const TEAL_DARK: RGB = [15, 118, 110];
const MINT: RGB = [214, 240, 236];
const TEXT: RGB = [37, 56, 62];
const MUTED: RGB = [107, 123, 128];
const WHITE: RGB = [255, 255, 255];

export type InsightsPdfOptions = {
  patientName?: string;
  daysSinceOp?: number;
  date: Date;
};

function subtitleLine({ patientName, daysSinceOp, date }: InsightsPdfOptions) {
  const parts: string[] = [];
  if (patientName) parts.push(`Per ${patientName}`);
  if (typeof daysSinceOp === "number") {
    parts.push(`Giorno ${daysSinceOp} del recupero`);
  }
  parts.push(
    date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  );
  return parts.join("   ·   ");
}

function fileName({ patientName, date }: InsightsPdfOptions) {
  const slug = patientName
    ? `-${patientName.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`
    : "";
  return `analisi-recupero${slug}-${date.toISOString().slice(0, 10)}.pdf`;
}

/**
 * Costruisce il documento PDF colorato dell'analisi e lo restituisce.
 * Separato dal salvataggio così può essere testato fuori dal browser.
 */
export async function buildInsightsPdf(
  insights: Insights,
  opts: InsightsPdfOptions,
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const contentW = W - M * 2;
  const bottom = H - 20;

  const paintBackground = () => {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, W, H, "F");
  };

  let y = 0;

  const drawHeart = (cx: number, cy: number, r: number, color: RGB) => {
    doc.setFillColor(...color);
    doc.circle(cx - r * 0.5, cy - r * 0.25, r * 0.6, "F");
    doc.circle(cx + r * 0.5, cy - r * 0.25, r * 0.6, "F");
    doc.triangle(
      cx - r * 1.02,
      cy - r * 0.05,
      cx + r * 1.02,
      cy - r * 0.05,
      cx,
      cy + r * 1.05,
      "F",
    );
  };

  const drawHeader = () => {
    const headerH = 46;
    doc.setFillColor(...TEAL);
    doc.rect(0, 0, W, headerH, "F");

    drawHeart(M + 5, 19, 3.6, WHITE);

    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Analisi del recupero", M + 14, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(subtitleLine(opts), M + 14, 31);

    y = headerH + 14;
  };

  // Aggiunge una pagina (sfondo crema) quando lo spazio sta per finire.
  const ensureSpace = (needed: number) => {
    if (y + needed <= bottom) return;
    doc.addPage();
    paintBackground();
    y = M + 4;
  };

  const drawSummary = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(insights.summary, contentW - 14) as string[];
    const boxH = lines.length * 5.6 + 12;
    ensureSpace(boxH + 4);
    doc.setFillColor(...MINT);
    doc.roundedRect(M, y, contentW, boxH, 3, 3, "F");
    doc.setFillColor(...TEAL);
    doc.rect(M, y, 2.2, boxH, "F");
    doc.setTextColor(...TEXT);
    doc.text(lines, M + 9, y + 9);
    y += boxH + 10;
  };

  const drawSection = (title: string, items: string[]) => {
    if (!items || items.length === 0) return;
    ensureSpace(16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const label = title.toUpperCase();
    const pillW = doc.getTextWidth(label) + 10;
    doc.setFillColor(...MINT);
    doc.roundedRect(M, y - 5, pillW, 8.5, 2, 2, "F");
    doc.setTextColor(...TEAL_DARK);
    doc.text(label, M + 5, y + 0.6);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    for (const item of items) {
      const lines = doc.splitTextToSize(item, contentW - 8) as string[];
      const blockH = lines.length * 5 + 2.5;
      ensureSpace(blockH);
      doc.setFillColor(...TEAL);
      doc.circle(M + 1.8, y - 1.5, 0.9, "F");
      doc.setTextColor(...TEXT);
      doc.text(lines, M + 6, y);
      y += blockH;
    }
    y += 5;
  };

  const drawFooter = () => {
    ensureSpace(22);
    doc.setDrawColor(...MINT);
    doc.setLineWidth(0.5);
    doc.line(M, y, W - M, y);
    y += 9;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(...TEAL);
    const cheer = opts.patientName
      ? `Un passo alla volta. Forza, ${opts.patientName}!`
      : "Un passo alla volta.";
    doc.text(cheer, W / 2, y, { align: "center" });
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(
      "Questi spunti non sostituiscono il parere del tuo medico.",
      W / 2,
      y,
      { align: "center" },
    );
  };

  paintBackground();
  drawHeader();
  drawSummary();
  drawSection("Pattern osservati", insights.patterns);
  drawSection("Suggerimenti", insights.suggestions);
  drawSection("Da chiedere al medico", insights.doctorQuestions);
  drawFooter();

  return doc;
}

/**
 * Genera e scarica il PDF dell'analisi del recupero.
 */
export async function downloadInsightsPdf(
  insights: Insights,
  opts: InsightsPdfOptions,
) {
  const doc = await buildInsightsPdf(insights, opts);
  doc.save(fileName(opts));
}
