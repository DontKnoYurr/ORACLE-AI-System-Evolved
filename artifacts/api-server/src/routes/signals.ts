import { Router } from "express";
import { db } from "@workspace/db";
import { signalsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { ListSignalsQueryParams, IngestSignalBody, ExpandSignalParams } from "@workspace/api-zod";
import { synthesizeSignalExpansion } from "../intelligence/synthesizer.js";
import { generateSeismicWaveform } from "../intelligence/field-math.js";

const router = Router();

router.get("/signals", async (req, res) => {
  const parsed = ListSignalsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};
  const results = await db.select().from(signalsTable).orderBy(desc(signalsTable.createdAt)).limit(params.limit ?? 50);
  const filtered = params.category
    ? results.filter((s) => s.category === params.category)
    : params.priority
    ? results.filter((s) => s.priority === params.priority)
    : results;
  return res.json(filtered.map(formatSignal));
});

router.post("/signals", async (req, res) => {
  const body = IngestSignalBody.parse(req.body);
  const [signal] = await db
    .insert(signalsTable)
    .values({
      title: body.title,
      content: body.content,
      category: body.category,
      priority: body.priority ?? "medium",
      source: body.source ?? null,
      tags: body.tags ?? [],
    })
    .returning();
  return res.status(201).json(formatSignal(signal));
});

router.post("/signals/:id/expand", async (req, res) => {
  const { id } = ExpandSignalParams.parse(req.params);
  const [signal] = await db.select().from(signalsTable).where(eq(signalsTable.id, id));
  if (!signal) return res.status(404).json({ error: "Signal not found" });

  // Proprietary intelligence synthesis
  const expansion = synthesizeSignalExpansion({
    title: signal.title,
    content: signal.content,
    category: signal.category,
    priority: signal.priority,
  });

  return res.json({
    signalId: id,
    deepAnalysis: expansion.deepAnalysis,
    relatedEntities: expansion.relatedEntities,
    implications: expansion.implications,
    confidence: expansion.confidence,
    seismicResonance: expansion.seismicResonance,
  });
});

function formatSignal(s: any) {
  return {
    ...s,
    tags: s.tags ?? [],
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
  };
}

export default router;
