import { Router } from "express";
import { db } from "@workspace/db";
import { anomaliesTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { ListAnomaliesQueryParams, ExplainAnomalyParams } from "@workspace/api-zod";
import { synthesizeAnomalyExplanation } from "../intelligence/synthesizer.js";

const router = Router();

router.get("/anomalies", async (req, res) => {
  const parsed = ListAnomaliesQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};
  let results = await db.select().from(anomaliesTable).orderBy(desc(anomaliesTable.detectedAt));
  if (params.severity) results = results.filter((a) => a.severity === params.severity);
  return res.json(results.slice(0, params.limit ?? 50).map(fmt));
});

router.post("/anomalies/:id/explain", async (req, res) => {
  const { id } = ExplainAnomalyParams.parse(req.params);
  const [anomaly] = await db.select().from(anomaliesTable).where(eq(anomaliesTable.id, id));
  if (!anomaly) return res.status(404).json({ error: "Anomaly not found" });

  // Proprietary intelligence synthesis
  const explanation = synthesizeAnomalyExplanation({
    title: anomaly.title,
    description: anomaly.description ?? "",
    severity: anomaly.severity,
    category: anomaly.category,
  });

  return res.json({
    anomalyId: id,
    detailedDescription: explanation.detailedDescription,
    rootCauses: explanation.rootCauses,
    sources: explanation.sources.map(s => ({ name: s.name, url: null, credibility: s.credibility })),
    impact: explanation.impact,
    recommendations: explanation.recommendations,
  });
});

function fmt(a: any) {
  return { ...a, detectedAt: a.detectedAt instanceof Date ? a.detectedAt.toISOString() : a.detectedAt };
}

export default router;
