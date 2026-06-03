import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mezzanotte locale di "giorni fa" rispetto a oggi.
function dayAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  // Reset: un solo paziente per questo tracker personale.
  await prisma.checkIn.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.patient.deleteMany();

  const operationDate = dayAgo(13);

  const patient = await prisma.patient.create({
    data: {
      name: "Maria",
      operationType: "Protesi al ginocchio",
      operationDate,
      medications: {
        create: [
          { name: "Paracetamolo" },
          { name: "Ibuprofene" },
          { name: "Eparina" },
        ],
      },
    },
    include: { medications: true },
  });

  const meds = patient.medications;
  const byName = (name: string) => meds.find((m) => m.name === name)!;

  // 5 giorni di check-in, con un trend di miglioramento e una piccola risalita
  // del dolore (utile per far emergere un pattern negli insight).
  const samples = [
    {
      daysAgo: 4,
      painLevel: 7,
      mobility: "bed_rest",
      mood: 2,
      notes: "Giornata difficile, molto dolore al risveglio.",
      meds: ["Paracetamolo", "Ibuprofene", "Eparina"],
    },
    {
      daysAgo: 3,
      painLevel: 6,
      mobility: "indoors",
      mood: 3,
      notes: "Riesco a fare qualche passo in casa con il deambulatore.",
      meds: ["Paracetamolo", "Eparina"],
    },
    {
      daysAgo: 2,
      painLevel: 5,
      mobility: "indoors",
      mood: 3,
      notes: "Dolore più gestibile durante il giorno, peggiora la sera.",
      meds: ["Paracetamolo", "Ibuprofene", "Eparina"],
    },
    {
      daysAgo: 1,
      painLevel: 4,
      mobility: "outdoors",
      mood: 4,
      notes: "Prima breve passeggiata in giardino, mi sento più forte.",
      meds: ["Paracetamolo", "Eparina"],
    },
    {
      daysAgo: 0,
      painLevel: 5,
      mobility: "outdoors",
      mood: 4,
      notes: "Un po' di dolore in più ieri sera, ma di giorno bene.",
      meds: ["Paracetamolo", "Ibuprofene", "Eparina"],
    },
  ];

  for (const s of samples) {
    await prisma.checkIn.create({
      data: {
        patientId: patient.id,
        date: dayAgo(s.daysAgo),
        painLevel: s.painLevel,
        mobility: s.mobility,
        mood: s.mood,
        notes: s.notes,
        medications: {
          connect: s.meds.map((name) => ({ id: byName(name).id })),
        },
      },
    });
  }

  console.log(
    `Seed completato: paziente ${patient.name}, ${samples.length} check-in.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
