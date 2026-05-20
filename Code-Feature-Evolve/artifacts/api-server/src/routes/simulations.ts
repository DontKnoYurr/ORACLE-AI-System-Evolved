import { Router } from "express";
import { db } from "@workspace/db";
import { simulationsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { CreateSimulationBody, RunSimulationParams } from "@workspace/api-zod";

const router = Router();

router.get("/simulations", async (req, res) => {
  const results = await db.select().from(simulationsTable).orderBy(desc(simulationsTable.createdAt)).limit(20);
  return res.json(results.map(fmt));
});

router.post("/simulations", async (req, res) => {
  const body = CreateSimulationBody.parse(req.body);
  const [sim] = await db
    .insert(simulationsTable)
    .values({
      name: body.name,
      description: body.description,
      status: "pending",
      parameters: body.parameters ?? null,
    })
    .returning();
  return res.status(201).json(fmt(sim));
});

router.post("/simulations/:id/run", async (req, res) => {
  const { id } = RunSimulationParams.parse(req.params);
  const [sim] = await db.select().from(simulationsTable).where(eq(simulationsTable.id, id));
  if (!sim) return res.status(404).json({ error: "Simulation not found" });

  const primaryProb = Math.random() * 0.4 + 0.45;
  const outcomes = {
    primary: `Primary outcome for "${sim.name}": After ${Math.floor(Math.random() * 5000 + 2000)} simulation iterations across quantum probability space, the dominant outcome cluster (${(primaryProb * 100).toFixed(1)}% probability mass) shows: Systemic state transition with ${Math.floor(Math.random() * 40 + 30)}% cascade amplification, resolving over ${["72 hours", "2 weeks", "3 months", "18 months"][Math.floor(Math.random() * 4)]} timeframe. Key forcing function: ${["seismic resonance buildup", "quantum attractor coalescence", "temporal velocity acceleration", "information cascade threshold"][Math.floor(Math.random() * 4)]}.`,
    probability: primaryProb,
    alternatives: [
      `Alternate branch A (${(Math.random() * 0.25 + 0.1).toFixed(2)} prob): Lateral domain shift — primary pressure deflects into adjacent system with 40% reduced intensity.`,
      `Alternate branch B (${(Math.random() * 0.15 + 0.05).toFixed(2)} prob): Rapid resolution — intervention at T+${Math.floor(Math.random() * 48 + 12)}h window collapses probability into benign attractor.`,
      `Alternate branch C (${(Math.random() * 0.1 + 0.02).toFixed(2)} prob): Black swan emergence — novel attractor state forms outside training distribution.`,
    ],
  };

  const [updated] = await db
    .update(simulationsTable)
    .set({ status: "completed", outcomes })
    .where(eq(simulationsTable.id, id))
    .returning();
  return res.json(fmt(updated));
});

function fmt(s: any) {
  return { ...s, createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt };
}

export default router;
