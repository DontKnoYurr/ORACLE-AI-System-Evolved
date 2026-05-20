import { Router } from "express";
import { db } from "@workspace/db";
import { seismicEventsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { ListSeismicEventsQueryParams, RecordSeismicEventBody, ComputePropagationBody } from "@workspace/api-zod";

const router = Router();

const RESONANCE_MAP: Record<string, { valence: number; freq: number; color: string; description: string }> = {
  danger:        { valence: -0.9, freq: 14, color: "red",     description: "HIGH ALERT: Danger resonance propagating" },
  mourning:      { valence: -0.4, freq: 4,  color: "blue",    description: "Collective grief signature detected" },
  communication: { valence:  0.6, freq: 10, color: "green",   description: "Information exchange pattern active" },
  mating:        { valence:  0.8, freq: 16, color: "purple",  description: "Cooperation/bonding signal detected" },
  territorial:   { valence: -0.5, freq: 8,  color: "orange",  description: "Boundary assertion resonance active" },
  unknown:       { valence:  0.0, freq: 6,  color: "white",   description: "Unclassified frequency pattern" },
};

const REGIONS = ["Eastern Europe", "East Asia", "Middle East", "Sub-Saharan Africa", "North America", "Western Europe", "South Asia", "Southeast Asia", "Latin America", "Pacific"];

function generateWaveform(freq: number, points = 128): number[] {
  return Array.from({ length: points }, (_, i) => {
    const t = i / points;
    return (
      Math.sin(2 * Math.PI * freq * t) * 0.6 +
      Math.sin(2 * Math.PI * freq * 2.3 * t) * 0.25 +
      Math.sin(2 * Math.PI * freq * 0.7 * t) * 0.15 +
      (Math.random() - 0.5) * 0.1
    );
  });
}

router.get("/seismic/events", async (req, res) => {
  const parsed = ListSeismicEventsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};
  let results = await db.select().from(seismicEventsTable).orderBy(desc(seismicEventsTable.createdAt));
  if (params.resonanceType) results = results.filter((e) => e.resonanceType === params.resonanceType);
  return res.json(results.slice(0, params.limit ?? 50).map(fmt));
});

router.post("/seismic/events", async (req, res) => {
  const body = RecordSeismicEventBody.parse(req.body);
  const rt = body.resonanceType as keyof typeof RESONANCE_MAP;
  const props = RESONANCE_MAP[rt] ?? RESONANCE_MAP.unknown;
  const propagation = Math.min(20000, body.intensity * 20 + Math.random() * 500);

  const affectedCount = Math.floor(propagation / 2000) + 1;
  const shuffled = REGIONS.filter((r) => r !== body.epicenterRegion).sort(() => Math.random() - 0.5);
  const affectedRegions = shuffled.slice(0, Math.min(affectedCount, 5));

  const [event] = await db
    .insert(seismicEventsTable)
    .values({
      title: body.title,
      description: body.description,
      resonanceType: body.resonanceType,
      frequency: props.freq + (Math.random() * 4 - 2),
      amplitude: body.intensity / 10,
      propagationRange: propagation,
      epicenterRegion: body.epicenterRegion,
      affectedRegions,
      emotionalValence: props.valence + (Math.random() * 0.2 - 0.1),
      intensity: body.intensity,
      waveform: generateWaveform(props.freq),
      decayRate: Math.random() * 0.2 + 0.05,
    })
    .returning();
  return res.status(201).json(fmt(event));
});

router.get("/seismic/resonance", async (req, res) => {
  const events = await db.select().from(seismicEventsTable).orderBy(desc(seismicEventsTable.createdAt)).limit(10);
  
  const avgValence = events.length > 0
    ? events.reduce((sum, e) => sum + e.emotionalValence, 0) / events.length
    : 0.1;
  
  const dominantType = events.length > 0
    ? Object.entries(
        events.reduce((acc, e) => { acc[e.resonanceType] = (acc[e.resonanceType] || 0) + 1; return acc; }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0][0]
    : "communication";

  const resonanceMap: Record<string, number> = {};
  REGIONS.forEach((r) => {
    const match = events.find((e) => e.epicenterRegion === r || (e.affectedRegions as string[]).includes(r));
    resonanceMap[r] = match ? match.intensity / 10 : Math.random() * 0.3;
  });

  const activeFreqs = events.slice(0, 5).map((e) => e.frequency);
  if (activeFreqs.length === 0) activeFreqs.push(10, 6, 14);

  return res.json({
    globalValence: avgValence,
    dominantResonance: dominantType,
    activeFrequencies: activeFreqs,
    resonanceMap,
    groundTruth: avgValence < -0.5
      ? "The earth's seismic substrate is under severe stress. Infrasonic danger signatures propagating across multiple regions simultaneously. All sensing systems on high alert."
      : avgValence < 0
      ? "Underlying tension detectable in seismic substrate. Low-frequency stress patterns building across continental fault zones. System vigilance elevated."
      : avgValence > 0.5
      ? "Positive resonance dominant. Communication and cooperation signals propagating through ground substrate. Unusual calm — potential precursor or genuine stability window."
      : "Mixed resonance state. Multiple competing frequencies in active propagation. System interpretation: transitional state, monitor closely.",
    pulseRate: Math.max(0.5, Math.min(4, 1 + Math.abs(avgValence) * 2)),
    updatedAt: new Date().toISOString(),
  });
});

router.post("/seismic/propagation", async (req, res) => {
  const body = ComputePropagationBody.parse(req.body);
  const speed = 3.5; // km/s surface wave speed
  const waveFronts = [500, 2000, 5000, 12000, 20000].map((radiusKm) => {
    const arrivalTime = radiusKm / speed;
    const attenuatedIntensity = body.intensity * Math.exp(-radiusKm / 8000);
    const affected = REGIONS.filter(() => Math.random() < 0.3 + body.intensity * 0.05);
    return {
      radiusKm,
      arrivalTime: Math.round(arrivalTime),
      intensity: Math.max(0, attenuatedIntensity),
      regions: affected,
    };
  });

  return res.json({
    epicenter: body.epicenterRegion,
    waveFronts,
    totalReach: 20000,
    predictedImpact: `${body.resonanceType.toUpperCase()} resonance originating at ${body.epicenterRegion} will propagate through seismic substrate at ~${speed}km/s. Wave front reaches maximum extent at ~${(20000 / speed / 60).toFixed(0)} minutes. Affected regions: ${waveFronts.flatMap((w) => w.regions).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).join(", ")}. Intensity decay follows exponential model with scale length 8000km.`,
  });
});

function fmt(e: any) {
  return { ...e, createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt };
}

export default router;
