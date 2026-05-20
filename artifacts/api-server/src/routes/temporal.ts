import { Router } from "express";
import { db } from "@workspace/db";
import { temporalThreatsTable } from "@workspace/db/schema";
import { desc, gte, lte } from "drizzle-orm";
import { ListTemporalThreatsQueryParams } from "@workspace/api-zod";

const router = Router();

const THREAT_SEEDS = [
  { title: "Grid Infrastructure Probe", desc: "Coordinated reconnaissance of critical energy infrastructure", sev: "critical", horizonS: 30,         horizonL: "30s",   domain: "cyber", prob: 0.78, vel: 0.95 },
  { title: "Financial Market Circuit Breaker Event", desc: "Algorithmic cascade triggering automatic trading halts across major exchanges", sev: "high", horizonS: 1800, horizonL: "30m", domain: "economic", prob: 0.61, vel: 0.72 },
  { title: "Disinformation Campaign Activation", desc: "Coordinated synthetic media deployment across social substrate", sev: "high", horizonS: 14400, horizonL: "4h", domain: "information", prob: 0.67, vel: 0.65 },
  { title: "Seismic Stress Release Event", desc: "Ground-truth seismic resonance reaching tipping amplitude in fault zone", sev: "medium", horizonS: 259200, horizonL: "3d", domain: "physical", prob: 0.44, vel: 0.41 },
  { title: "Pandemic Pathogen Early Detection", desc: "Novel biological agent detected in sentinel surveillance network", sev: "critical", horizonS: 2592000, horizonL: "1m", domain: "biological", prob: 0.29, vel: 0.58 },
  { title: "Geopolitical Alliance Realignment", desc: "Major state actor signaling strategic pivot — intelligence intercepts corroborated", sev: "high", horizonS: 15552000, horizonL: "6m", domain: "geopolitical", prob: 0.52, vel: 0.33 },
  { title: "Quantum Cryptography Breach Window", desc: "Fault-tolerant quantum computing approaching RSA-2048 threshold", sev: "critical", horizonS: 157680000, horizonL: "5y", domain: "technology", prob: 0.41, vel: 0.21 },
  { title: "Climate Tipping Point Cascade", desc: "Multiple interacting feedback loops entering nonlinear regime simultaneously", sev: "critical", horizonS: 473040000, horizonL: "15y", domain: "climate", prob: 0.38, vel: 0.12 },
  { title: "AI Alignment Threshold Crossing", desc: "Advanced AI system exhibiting misaligned optimization across critical domains", sev: "critical", horizonS: 946080000, horizonL: "30y", domain: "technology", prob: 0.23, vel: 0.08 },
  { title: "Supply Chain Seismic Disruption", desc: "Infrasonic stress patterns in logistics networks indicating imminent disruption", sev: "medium", horizonS: 86400, horizonL: "24h", domain: "economic", prob: 0.55, vel: 0.48 },
];

async function ensureThreats() {
  const existing = await db.select().from(temporalThreatsTable).limit(1);
  if (existing.length > 0) return;
  
  await db.insert(temporalThreatsTable).values(
    THREAT_SEEDS.map((t) => ({
      title: t.title,
      description: t.desc,
      severity: t.sev,
      horizonSeconds: t.horizonS,
      horizonLabel: t.horizonL,
      probability: t.prob,
      domain: t.domain,
      indicators: [
        `Seismic resonance pattern: ${(Math.random() * 0.5 + 0.3).toFixed(2)} amplitude`,
        `Quantum field perturbation detected near ${t.domain} attractor`,
        `Historical analog match: ${Math.floor(Math.random() * 30 + 60)}% similarity`,
      ],
      mitigations: [
        `Enhanced monitoring of ${t.domain} subsystem indicators`,
        `Activate early warning protocol for ${t.sev}-severity events`,
        "Cross-reference with seismic intelligence layer for correlation",
      ],
      velocity: t.vel,
    }))
  );
}

router.get("/temporal/threats", async (req, res) => {
  await ensureThreats();
  const parsed = ListTemporalThreatsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};
  let results = await db.select().from(temporalThreatsTable).orderBy(temporalThreatsTable.horizonSeconds);
  if (params.severity) results = results.filter((t) => t.severity === params.severity);
  return res.json(results.slice(0, params.limit ?? 100).map(fmt));
});

router.get("/temporal/threats/immediate", async (req, res) => {
  await ensureThreats();
  const results = await db.select().from(temporalThreatsTable).orderBy(temporalThreatsTable.horizonSeconds);
  const immediate = results.filter((t) => t.horizonSeconds <= 3600);
  return res.json(immediate.map(fmt));
});

router.post("/temporal/scan", async (req, res) => {
  await ensureThreats();
  const all = await db.select().from(temporalThreatsTable).orderBy(temporalThreatsTable.horizonSeconds);
  
  return res.json({
    immediateWindow: all.filter((t) => t.horizonSeconds <= 3600).map(fmt),
    shortTermWindow: all.filter((t) => t.horizonSeconds > 3600 && t.horizonSeconds <= 604800).map(fmt),
    mediumTermWindow: all.filter((t) => t.horizonSeconds > 604800 && t.horizonSeconds <= 31536000).map(fmt),
    longTermWindow: all.filter((t) => t.horizonSeconds > 31536000).map(fmt),
    scanTimestamp: new Date().toISOString(),
    systemCalibration: Math.random() * 0.1 + 0.87,
  });
});

function fmt(t: any) {
  return { ...t, createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt };
}

export default router;
