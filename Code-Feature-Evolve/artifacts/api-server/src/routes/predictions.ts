import { Router } from "express";
import { db } from "@workspace/db";
import { predictionsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { ListPredictionsQueryParams, ExpandPredictionParams } from "@workspace/api-zod";

const router = Router();

const DOMAINS = ["geopolitical", "economic", "climate", "technology", "social", "military", "cyber", "biological"];
const HORIZONS = ["30s", "5m", "1h", "6h", "24h", "3d", "1w", "1m", "6m", "1y", "5y", "10y", "30y"];
const TEMPORAL_SCALES = ["immediate", "short-term", "medium-term", "long-term", "generational"];

const PREDICTION_TEMPLATES = [
  { title: "Financial Contagion Vector Emergence", domain: "economic", horizon: "6h", impact: "critical", prob: 0.73 },
  { title: "Coordinated Infrastructure Disruption Pattern", domain: "cyber", horizon: "3d", impact: "high", prob: 0.61 },
  { title: "Geomagnetic Storm Impact on Communications Grid", domain: "technology", horizon: "24h", impact: "medium", prob: 0.84 },
  { title: "State Actor Disinformation Campaign Activation", domain: "geopolitical", horizon: "1w", impact: "high", prob: 0.69 },
  { title: "Climate Tipping Point Cascade Initiation", domain: "climate", horizon: "5y", impact: "critical", prob: 0.47 },
  { title: "Quantum Computing Cryptography Breach Window", domain: "cyber", horizon: "10y", impact: "critical", prob: 0.38 },
  { title: "Global Supply Chain Seismic Disruption", domain: "economic", horizon: "1m", impact: "high", prob: 0.55 },
  { title: "AI Alignment Threshold Event", domain: "technology", horizon: "30y", impact: "critical", prob: 0.23 },
];

router.get("/predictions", async (req, res) => {
  const parsed = ListPredictionsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};
  let results = await db.select().from(predictionsTable).orderBy(desc(predictionsTable.probability));
  if (params.horizon) results = results.filter((p) => p.horizon === params.horizon);
  return res.json(results.slice(0, params.limit ?? 50).map(fmt));
});

router.post("/predictions/generate", async (req, res) => {
  const toGenerate = PREDICTION_TEMPLATES.slice(0, 4 + Math.floor(Math.random() * 3));
  const inserted = await Promise.all(
    toGenerate.map((t) =>
      db.insert(predictionsTable).values({
        title: t.title,
        description: `Oracle synthesis: ${t.title} — Based on convergent seismic resonance patterns, quantum field perturbations, and historical analog matching. Confidence-weighted Bayesian inference across 847 data dimensions. Pattern emergence detected in ${DOMAINS[Math.floor(Math.random() * DOMAINS.length)]} subsystem.`,
        probability: t.prob + (Math.random() * 0.1 - 0.05),
        horizon: t.horizon,
        impact: t.impact,
        domain: t.domain,
        temporalScale: t.horizon.includes("y") ? (parseInt(t.horizon) > 5 ? "generational" : "long-term") : t.horizon.includes("m") || t.horizon.includes("w") ? "medium-term" : "short-term",
      }).returning()
    )
  );
  return res.json(inserted.map((r) => fmt(r[0])));
});

router.post("/predictions/:id/expand", async (req, res) => {
  const { id } = ExpandPredictionParams.parse(req.params);
  const [pred] = await db.select().from(predictionsTable).where(eq(predictionsTable.id, id));
  if (!pred) return res.status(404).json({ error: "Prediction not found" });

  return res.json({
    predictionId: id,
    fullAnalysis: `Comprehensive Oracle Analysis: "${pred.title}" — Temporal horizon: ${pred.horizon}. This prediction emerges from the confluence of ${Math.floor(Math.random() * 40 + 20)} correlated data streams across the seismic intelligence layer, quantum field perturbations, and historical pattern recognition. The ${pred.domain} domain is showing elevated instability signatures consistent with pre-cascade conditions. Infrasonic resonance analysis (0.1-8Hz band) indicates significant sub-perceptual stress accumulation. Quantum coherence measurements show decoherence patterns consistent with rapid state transition. The Bayesian engine assigns ${(pred.probability * 100).toFixed(1)}% probability with an entropy measure of ${(Math.random() * 0.3 + 0.1).toFixed(3)} nats/symbol. Cross-domain cascade probability: ${(Math.random() * 0.4 + 0.3).toFixed(2)}.`,
    keyFactors: [
      "Seismic resonance pattern matching pre-2008 financial crisis signature",
      "Quantum field attractor nodes coalescing around prediction epicenter",
      "Historical analog: 3 of 4 comparable situations resulted in predicted outcome",
      `Temporal velocity: accelerating — ${(pred.probability * 100).toFixed(0)}% probability reached in compressed timeline`,
      "Cross-domain amplification effect detected in adjacent systems",
    ].slice(0, Math.floor(Math.random() * 2) + 3),
    scenarios: [
      { name: "APEX_CONVERGENCE", probability: pred.probability, description: `Primary scenario: Full ${pred.title} manifests within predicted window with ${pred.impact} impact across ${pred.domain} domain and adjacent systems.` },
      { name: "LATERAL_DISPLACEMENT", probability: Math.max(0.05, pred.probability * 0.4), description: "Secondary scenario: Event materializes but deflects into adjacent domain, reducing primary impact by 40-60% while creating secondary cascade." },
      { name: "TEMPORAL_SLIP", probability: Math.max(0.05, 1 - pred.probability - 0.1), description: "Tertiary scenario: Pattern dissipates before threshold crossing. Underlying conditions persist and reform on extended timeline (+180-360 days)." },
    ],
    confidence: pred.probability * 0.9 + Math.random() * 0.1,
  });
});

function fmt(p: any) {
  return { ...p, createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt };
}

export default router;
