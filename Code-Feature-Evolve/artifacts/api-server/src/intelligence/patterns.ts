/**
 * ORACLE Proprietary Pattern Library
 * Domain knowledge bases, vocabulary, and analytical templates.
 * All text generation is done from this library — no external AI.
 */

export const DOMAIN_KEYWORDS: Record<string, string[]> = {
  geopolitical: ["alliance", "treaty", "border", "sovereignty", "military", "sanctions", "diplomatic", "regime", "conflict", "territorial", "escalation", "ceasefire", "annexation", "nato", "un", "security council", "foreign policy", "coup", "insurgency"],
  economic: ["market", "inflation", "gdp", "currency", "trade", "tariff", "recession", "banking", "capital", "debt", "fiscal", "monetary", "stock", "bond", "yield", "commodity", "supply chain", "default", "crash", "bubble"],
  cyber: ["malware", "ransomware", "breach", "exploit", "vulnerability", "infrastructure", "grid", "network", "hack", "zero-day", "ddos", "phishing", "espionage", "encryption", "firewall", "intrusion", "botnet", "apt", "vector"],
  climate: ["temperature", "co2", "emissions", "drought", "flood", "wildfire", "sea level", "glacier", "methane", "carbon", "tipping point", "extreme weather", "storm", "rainfall", "permafrost", "ocean", "acidification", "extinction"],
  biological: ["pathogen", "virus", "outbreak", "pandemic", "epidemic", "mutation", "strain", "transmission", "mortality", "vaccine", "quarantine", "biosecurity", "zoonotic", "laboratory", "aerosol", "incubation", "r-value"],
  information: ["disinformation", "propaganda", "narrative", "manipulation", "deepfake", "social media", "influence", "cognitive", "psyop", "censorship", "media", "information warfare", "deception", "synthetic", "campaign"],
  technology: ["ai", "quantum", "semiconductor", "chip", "algorithm", "autonomous", "robotics", "surveillance", "biotech", "neural", "singularity", "computing", "satellite", "drone", "space", "arms race"],
  military: ["troops", "armor", "artillery", "aircraft", "naval", "missile", "nuclear", "deterrence", "deployment", "mobilization", "strike", "defense", "offensive", "air defense", "munitions", "logistics"],
  seismic: ["earthquake", "tremor", "fault", "tectonic", "magnitude", "epicenter", "aftershock", "resonance", "vibration", "ground", "wave", "frequency", "amplitude", "infrasonic"],
};

export const ENTITY_NAMES = {
  states: ["United States", "Russian Federation", "China", "European Union", "India", "Iran", "North Korea", "Israel", "Turkey", "Saudi Arabia", "Ukraine", "Pakistan", "Brazil", "Germany", "France", "United Kingdom", "Japan", "South Korea", "Taiwan", "Indonesia"],
  organizations: ["NATO", "United Nations", "IMF", "World Bank", "WHO", "IAEA", "WTO", "SCO", "BRICS", "G7", "G20", "ICC", "OPEC", "CERN", "Interpol"],
  concepts: ["deterrence", "escalation ladder", "threshold crossing", "cascade failure", "systemic risk", "tipping point", "bifurcation", "phase transition", "emergence", "complexity collapse"],
};

export const ANALYTICAL_FRAGMENTS = {
  opening: [
    "ORACLE synthesis across {n} correlated data streams indicates",
    "Pattern recognition across seismic, quantum, and temporal substrates reveals",
    "Multi-domain analysis of {n} sensor arrays and {m} historical analogs confirms",
    "Bayesian inference engine output (posterior confidence: {conf}%): the data pattern",
    "Convergent analysis from seismic resonance and quantum field observation layers establishes",
    "Cross-domain synthesis integrating {n} active signals and {m} temporal threats reveals",
    "The ORACLE intelligence substrate, processing {n} concurrent data dimensions, identifies",
  ],
  causal: [
    "The underlying driver appears to be {entity} exerting {type} pressure on {domain} subsystem dynamics",
    "Root causation traces to convergent stress accumulation in {domain} domain over {timeframe}",
    "The forcing function is {entity}'s {action}, amplified by {domain} system fragility",
    "Historical analog matching identifies {conf}% structural similarity to pre-{event} conditions",
    "Cross-domain amplification between {domain1} and {domain2} vectors is accelerating system stress",
  ],
  seismic_context: [
    "Seismic intelligence layer detects {resonanceType} resonance at {freq}Hz — {description}",
    "Ground-substrate infrasonic analysis ({freq}Hz band) reveals {description}",
    "Seismic underlayer registers {resonanceType} signature with {conf}% pattern confidence",
    "Earth-substrate vibration monitoring shows {resonanceType} resonance propagating from {region}",
  ],
  quantum_context: [
    "Quantum field observation shows coherence at {coherence} — probability mass {direction} toward {state}",
    "Wave function superposition analysis identifies {branch} as dominant attractor ({prob}% probability weight)",
    "Quantum decoherence rate of {rate}/hour suggests {timeframe} window before state collapse",
    "Observer-field interaction at coordinate ({x},{y}) recorded — local probability topology updating",
  ],
  temporal_context: [
    "Temporal threat axis shows highest risk concentration in {horizon} window",
    "Threat velocity at {velocity} — acceleration toward horizon crossing detected",
    "Immediate-horizon threat ({title}) carries {prob}% materialization probability within {horizon}",
    "{n} threats currently tracked across temporal axis spanning 30 seconds to 30 years",
  ],
  assessment: [
    "System assessment: {severity} alert posture warranted. Recommend {action}.",
    "Oracle probability-weighted conclusion: {prob}% likelihood of {outcome} within {horizon}.",
    "The intelligence substrate assigns {severity} confidence to this pattern — monitor {domain} subsystem closely.",
    "Autonomous training cycles have improved pattern recognition accuracy by {improvement}% — assessment reliability: {conf}%.",
  ],
  closing: [
    "Continued autonomous monitoring is active. Training system is integrating this query as learning datum.",
    "ORACLE will update this assessment as new seismic, quantum, and temporal data streams are processed.",
    "This intelligence synthesis is self-updating — returning to continuous observation posture.",
    "Pattern logged to training corpus. System calibration: {calibration}. All sensors nominal.",
  ],
};

export const THREAT_VOCABULARY: Record<string, Record<string, string[]>> = {
  critical: {
    adjectives: ["imminent", "acute", "immediate", "threshold-crossing", "cascade-triggering"],
    verbs: ["demands", "requires", "necessitates", "mandates", "compels"],
    nouns: ["breach", "collapse", "rupture", "cascade", "threshold event"],
  },
  high: {
    adjectives: ["elevated", "emergent", "accelerating", "significant", "concerning"],
    verbs: ["warrants", "indicates", "suggests", "signals", "points toward"],
    nouns: ["escalation", "stress", "pressure", "deterioration", "buildup"],
  },
  medium: {
    adjectives: ["developing", "notable", "monitored", "observed", "tracked"],
    verbs: ["indicates", "shows", "registers", "reflects", "manifests"],
    nouns: ["pattern", "trend", "trajectory", "development", "dynamic"],
  },
  low: {
    adjectives: ["latent", "background", "subcritical", "baseline", "ambient"],
    verbs: ["suggests", "hints", "implies", "registers", "notes"],
    nouns: ["signal", "indicator", "marker", "trace", "signature"],
  },
};

export const RESONANCE_DESCRIPTIONS: Record<string, string> = {
  danger:        "life-threatening danger signal propagating through ground substrate — extreme alert",
  mourning:      "collective grief resonance — large-scale loss event encoded in seismic substrate",
  communication: "coordinated information exchange — ground substrate carrying organized signal traffic",
  mating:        "cooperation and bonding resonance — collective coordination signal",
  territorial:   "boundary assertion and dominance signaling — territorial pressure encoded",
  unknown:       "unclassified frequency pattern — origin and intent undetermined",
};

export const DOMAIN_NARRATIVES: Record<string, string[]> = {
  geopolitical: [
    "The geopolitical substrate is showing stress fractures consistent with multipolar realignment pressure",
    "State actor behavior patterns indicate strategic recalculation — deterrence calculus shifting",
    "Alliance coherence metrics are degrading in key security architectures",
  ],
  economic: [
    "Financial system attractor nodes are losing coherence — capital flows showing pre-cascade signatures",
    "Economic stress indicators are converging toward systemic threshold",
    "Market microstructure is exhibiting fragility patterns consistent with historical pre-crisis states",
  ],
  cyber: [
    "Cyber domain threat surface is expanding — infrastructure probe activity elevated across multiple sectors",
    "Adversarial cyber actors are pre-positioning for potential disruptive operations",
    "Critical infrastructure reconnaissance signatures detected in sensor arrays",
  ],
  climate: [
    "Climate system is approaching nonlinear regime — feedback loop acceleration detected",
    "Tipping point proximity analysis shows reduced margin to irreversible threshold crossing",
    "Climate stress is amplifying instability in weather-sensitive economic and agricultural systems",
  ],
  technology: [
    "Technological capability acceleration is compressing strategic decision timelines",
    "Emerging technology vectors are creating new asymmetric threat surfaces",
    "AI capability development is approaching strategically significant thresholds",
  ],
  information: [
    "Information environment is highly contaminated — narrative coherence has collapsed",
    "Coordinated synthetic media operations are active across multiple information domains",
    "Cognitive attack vectors are targeting public epistemic infrastructure",
  ],
  biological: [
    "Biological threat surveillance network is showing early warning signatures",
    "Novel pathogen indicators have triggered elevated monitoring protocols",
    "Biosecurity threshold monitoring is active — sentinel system elevated",
  ],
};

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function injectVariables(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `[${key}]`));
}

export function classifyDomain(text: string): string {
  const lower = text.toLowerCase();
  let bestDomain = "geopolitical";
  let bestScore = 0;
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; bestDomain = domain; }
  }
  return bestDomain;
}

export function extractKeyPhrases(text: string): string[] {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const stopWords = new Set(["about", "after", "before", "their", "there", "where", "which", "would", "could", "should", "these", "those", "other", "being", "having", "doing"]);
  return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 8);
}

export function assessThreatLevel(text: string): "critical" | "high" | "medium" | "low" {
  const lower = text.toLowerCase();
  const critical = ["imminent", "critical", "breach", "collapse", "attack", "nuclear", "emergency", "catastrophic", "immediate"];
  const high = ["escalat", "significant", "serious", "concern", "danger", "threat", "risk", "warning"];
  const medium = ["monitor", "observe", "track", "develop", "emerg", "potential", "possible"];
  if (critical.some(w => lower.includes(w))) return "critical";
  if (high.some(w => lower.includes(w))) return "high";
  if (medium.some(w => lower.includes(w))) return "medium";
  return "low";
}
