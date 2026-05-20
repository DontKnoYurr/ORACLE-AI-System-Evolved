/**
 * ORACLE Proprietary Field Mathematics
 * Real wave physics, quantum field equations, seismic propagation models.
 * All computation is original — no AI, no external libraries.
 */

export const PI = Math.PI;
export const TWO_PI = 2 * PI;

// ═══════════════════════════════════════════
// SEISMIC WAVE PHYSICS
// ═══════════════════════════════════════════

/**
 * Generate a realistic seismic waveform using superposition of modes.
 * Based on surface wave dispersion theory.
 */
export function generateSeismicWaveform(
  frequency: number,
  amplitude: number,
  decayRate: number,
  emotionalValence: number,
  points: number = 256
): number[] {
  const waveform: number[] = [];
  // Primary Rayleigh wave mode
  const f1 = frequency;
  // Secondary Love wave mode (typically 0.7x primary)
  const f2 = frequency * 0.73;
  // Infrasonic component
  const f3 = frequency * 0.18;
  // High-frequency coda
  const f4 = frequency * 2.31;

  for (let i = 0; i < points; i++) {
    const t = i / points;
    const decay = Math.exp(-decayRate * t * 10);

    // Rayleigh wave (retrograde elliptical motion → sine with phase shift)
    const rayleigh = Math.sin(TWO_PI * f1 * t * 3 + PI * 0.25) * 0.55;
    // Love wave (transverse horizontal)
    const love = Math.sin(TWO_PI * f2 * t * 3 + PI * 0.1) * 0.25;
    // Infrasonic carrier
    const infra = Math.sin(TWO_PI * f3 * t * 3) * 0.15;
    // High-freq coda
    const coda = Math.sin(TWO_PI * f4 * t * 3 + PI * emotionalValence) * 0.05 * (1 - t);
    // Gaussian noise representing ground microseisms
    const noise = (Math.random() - 0.5) * 0.06;

    waveform.push((rayleigh + love + infra + coda + noise) * amplitude * decay);
  }
  return waveform;
}

/**
 * Seismic wave propagation speed (km/s) by wave type and crustal structure.
 */
export function propagationSpeed(waveType: "P" | "S" | "Rayleigh" | "Love", crustalType: "oceanic" | "continental" | "shield"): number {
  const speeds = {
    P:        { oceanic: 6.8, continental: 6.2, shield: 6.5 },
    S:        { oceanic: 3.9, continental: 3.6, shield: 3.8 },
    Rayleigh: { oceanic: 3.5, continental: 3.3, shield: 3.6 },
    Love:     { oceanic: 4.1, continental: 3.8, shield: 4.0 },
  };
  return speeds[waveType][crustalType];
}

/**
 * Amplitude attenuation with distance using geometric spreading + anelastic attenuation.
 */
export function attenuateAmplitude(initialAmplitude: number, distanceKm: number, frequency: number, Q: number = 400): number {
  // Geometric spreading: 1/r for body waves, 1/sqrt(r) for surface waves
  const geometricDecay = 1 / Math.sqrt(Math.max(1, distanceKm));
  // Anelastic attenuation: exp(-π * f * r / (Q * v))
  const v = 3.5; // surface wave speed km/s
  const anelastic = Math.exp(-(PI * frequency * distanceKm) / (Q * v));
  return initialAmplitude * geometricDecay * anelastic;
}

/**
 * Compute resonance frequency from source characteristics.
 * Models the dominant infrasonic frequency of a large-scale event.
 */
export function resonanceFrequency(sourceRadius: number, waveSpeed: number): number {
  // Fundamental resonance: f = v / (2L) where L is characteristic length
  return waveSpeed / (2 * sourceRadius);
}

/**
 * Compute emotional valence from frequency content.
 * Based on biological mapping of infrasonic frequencies to physiological responses.
 */
export function computeEmotionalValence(frequency: number, amplitude: number, resonanceType: string): number {
  // Physiological frequency mappings (Hz → emotional response):
  // 0.5-2Hz: fear/unease (infrasound resonates in human organs)
  // 2-8Hz: collective stress/alertness
  // 8-16Hz: communication/bonding (overlaps elephant communication)
  // 16-20Hz: territorial/aggressive

  const baseValence: Record<string, number> = {
    danger: -0.85,
    mourning: -0.45,
    territorial: -0.40,
    unknown: 0.0,
    communication: 0.55,
    mating: 0.80,
  };

  const freqModifier = frequency < 2 ? -0.3 : frequency < 8 ? -0.1 : frequency < 16 ? 0.2 : 0.1;
  const ampModifier = (amplitude - 0.5) * 0.3;
  const base = baseValence[resonanceType] ?? 0;

  return Math.max(-1, Math.min(1, base + freqModifier + ampModifier + (Math.random() - 0.5) * 0.1));
}

// ═══════════════════════════════════════════
// QUANTUM FIELD MATHEMATICS
// ═══════════════════════════════════════════

/**
 * Magnetic dipole field at point (x,y) from source at (sx,sy).
 * B = μ₀/(4π) * [3(m·r̂)r̂ - m] / r³
 * Simplified to 2D field line calculation.
 */
export function magneticFieldAt(
  px: number, py: number,
  sx: number, sy: number,
  moment: number,
  polarity: number // +1 or -1
): { bx: number; by: number; magnitude: number } {
  const dx = px - sx;
  const dy = py - sy;
  const r = Math.sqrt(dx * dx + dy * dy);
  if (r < 0.001) return { bx: 0, by: 0, magnitude: 0 };

  const r3 = r * r * r;
  const mx = 0; // magnetic moment direction (pointing down)
  const my = polarity;
  const mdotr = mx * dx / r + my * dy / r;

  const bx = (3 * mdotr * dx / r - mx) * moment / r3;
  const by = (3 * mdotr * dy / r - my) * moment / r3;
  const magnitude = Math.sqrt(bx * bx + by * by);

  return { bx, by, magnitude };
}

/**
 * Total magnetic field at point from all nodes (superposition principle).
 */
export function totalFieldAt(
  px: number, py: number,
  nodes: Array<{ x: number; y: number; strength: number; polarity: number }>
): { bx: number; by: number; magnitude: number } {
  let totalBx = 0;
  let totalBy = 0;
  for (const node of nodes) {
    const field = magneticFieldAt(px, py, node.x, node.y, node.strength, node.polarity);
    totalBx += field.bx;
    totalBy += field.by;
  }
  const magnitude = Math.sqrt(totalBx * totalBx + totalBy * totalBy);
  return { bx: totalBx, by: totalBy, magnitude };
}

/**
 * Wave function probability density (Born rule: |ψ|²).
 * Models quantum superposition of threat states.
 */
export function waveFunctionProbability(
  position: { x: number; y: number },
  attractors: Array<{ x: number; y: number; amplitude: number; phase: number }>
): number {
  // Compute ψ as sum of Gaussian wave packets
  let realPart = 0;
  let imagPart = 0;
  for (const a of attractors) {
    const dx = position.x - a.x;
    const dy = position.y - a.y;
    const r2 = dx * dx + dy * dy;
    const gaussian = a.amplitude * Math.exp(-r2 / 0.05);
    realPart += gaussian * Math.cos(a.phase + r2 * TWO_PI * 3);
    imagPart += gaussian * Math.sin(a.phase + r2 * TWO_PI * 3);
  }
  // |ψ|² = real² + imag²
  return Math.min(1, realPart * realPart + imagPart * imagPart);
}

/**
 * Decoherence rate based on environmental coupling strength.
 * Higher coupling → faster decoherence → probability collapse.
 */
export function decoherenceRate(environmentalCoupling: number, temperature: number): number {
  // Caldeira-Leggett model (simplified): Γ = γ * kT / ℏ
  // Using dimensionless units where kT/ℏ ≈ 1
  return environmentalCoupling * temperature * 0.01;
}

/**
 * Quantum coherence time: how long superposition is maintained.
 */
export function coherenceTime(decoherenceRateValue: number): number {
  return decoherenceRateValue > 0 ? 1 / decoherenceRateValue : Infinity;
}

/**
 * Observer effect: probability update from measurement.
 * Models wave function collapse at observation point.
 */
export function collapseWaveFunction(
  x: number, y: number,
  currentProbabilities: number[],
  observerStrength: number = 1.0
): { collapsed: boolean; dominantBranch: number; entropy: number } {
  // Calculate entropy before collapse
  const total = currentProbabilities.reduce((a, b) => a + b, 0) || 1;
  const normalized = currentProbabilities.map(p => p / total);
  const entropyBefore = -normalized.filter(p => p > 0).reduce((s, p) => s + p * Math.log2(p), 0);

  // Observer effect: amplify highest probability branch
  const maxProb = Math.max(...currentProbabilities);
  const dominantBranch = currentProbabilities.indexOf(maxProb);

  // Determine if collapse occurs (depends on observer strength and coherence)
  const collapseThreshold = 0.3 + (1 - observerStrength) * 0.4;
  const collapsed = Math.random() < observerStrength * (maxProb / total);

  return { collapsed, dominantBranch, entropy: entropyBefore };
}

// ═══════════════════════════════════════════
// TEMPORAL MATHEMATICS
// ═══════════════════════════════════════════

/**
 * Logarithmic time scale mapping (seconds → normalized position).
 * Maps 30s → 0, 30y → 1 on a log scale.
 */
export function temporalPosition(horizonSeconds: number): number {
  const minLog = Math.log10(30);         // 30 seconds
  const maxLog = Math.log10(946080000);  // 30 years
  const logH = Math.log10(Math.max(30, horizonSeconds));
  return (logH - minLog) / (maxLog - minLog);
}

/**
 * Threat acceleration: d²p/dt² — second derivative of probability w.r.t. time.
 */
export function threatAcceleration(velocity: number, prevVelocity: number, dtHours: number): number {
  return dtHours > 0 ? (velocity - prevVelocity) / dtHours : 0;
}

/**
 * Expected time to materialization given current probability and velocity.
 */
export function expectedMaterializationTime(probability: number, velocity: number): number | null {
  // Time to reach 0.9 probability threshold
  const target = 0.9;
  if (probability >= target) return 0;
  if (velocity <= 0) return null;
  return (target - probability) / velocity; // in hours
}
