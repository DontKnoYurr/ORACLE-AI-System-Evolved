/**
 * ORACLE Proprietary NLP Engine
 * Named entity extraction, classification, sentiment analysis.
 * Pure algorithmic — no external AI, no ML libraries.
 */

import { DOMAIN_KEYWORDS, ENTITY_NAMES, assessThreatLevel, classifyDomain, extractKeyPhrases } from "./patterns.js";

export interface ExtractedSignal {
  title: string;
  content: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  source: string;
  tags: string[];
  seismicRelevance: number;
  quantumRelevance: number;
  temporalRelevance: number;
}

export interface EntityMention {
  name: string;
  type: "state" | "organization" | "concept";
  confidence: number;
}

/**
 * Extract named entities from text using curated entity lists.
 */
export function extractEntities(text: string): EntityMention[] {
  const lower = text.toLowerCase();
  const found: EntityMention[] = [];

  for (const name of ENTITY_NAMES.states) {
    if (lower.includes(name.toLowerCase())) {
      found.push({ name, type: "state", confidence: 0.9 });
    }
  }
  for (const name of ENTITY_NAMES.organizations) {
    if (lower.includes(name.toLowerCase())) {
      found.push({ name, type: "organization", confidence: 0.85 });
    }
  }
  for (const concept of ENTITY_NAMES.concepts) {
    if (lower.includes(concept.toLowerCase())) {
      found.push({ name: concept, type: "concept", confidence: 0.75 });
    }
  }

  return found.slice(0, 8);
}

/**
 * Compute seismic relevance score — how much physical/ground-level disruption this signal represents.
 */
export function seismicRelevance(text: string): number {
  const lower = text.toLowerCase();
  const seismicIndicators = [
    "explosion", "detonation", "earthquake", "tremor", "blast", "strike", "bombardment",
    "collapse", "building", "infrastructure", "factory", "military", "troops", "convoy",
    "protest", "crowd", "riot", "movement", "migration", "displacement",
  ];
  const matches = seismicIndicators.filter(w => lower.includes(w)).length;
  return Math.min(1, matches * 0.12 + Math.random() * 0.15);
}

/**
 * Compute quantum field relevance — how much this affects probability topology.
 */
export function quantumRelevance(text: string): number {
  const lower = text.toLowerCase();
  const quantumIndicators = [
    "uncertain", "probability", "potential", "possible", "might", "could", "risk",
    "election", "negotiation", "decision", "summit", "vote", "announcement", "agreement",
    "treaty", "ceasefire", "deal", "breakthrough", "failure", "collapse",
  ];
  const matches = quantumIndicators.filter(w => lower.includes(w)).length;
  return Math.min(1, matches * 0.1 + Math.random() * 0.2);
}

/**
 * Compute temporal relevance — how time-sensitive this signal is.
 */
export function temporalRelevance(text: string): number {
  const lower = text.toLowerCase();
  const urgencyWords = [
    "breaking", "urgent", "immediate", "now", "today", "hours", "minutes",
    "imminent", "deadline", "tonight", "this week", "latest", "just",
  ];
  const matches = urgencyWords.filter(w => lower.includes(w)).length;
  return Math.min(1, matches * 0.18 + Math.random() * 0.15);
}

/**
 * Compute threat valence score (-1 destabilizing, +1 stabilizing).
 */
export function computeValence(text: string): number {
  const lower = text.toLowerCase();
  const negative = ["attack", "conflict", "war", "violence", "collapse", "crash", "failure", "crisis", "threat", "destabilize", "sanction", "protest", "riot", "coup", "invasion", "escalat"];
  const positive = ["peace", "agreement", "ceasefire", "stabilize", "cooperat", "support", "aid", "recover", "growth", "success", "breakthrough", "deal", "treaty", "alliance", "diplomatic"];
  const negScore = negative.filter(w => lower.includes(w)).length;
  const posScore = positive.filter(w => lower.includes(w)).length;
  const total = negScore + posScore;
  if (total === 0) return (Math.random() - 0.5) * 0.3;
  return (posScore - negScore) / total;
}

/**
 * Process raw news text into a structured signal for ORACLE.
 */
export function processRawIntelligence(
  rawTitle: string,
  rawContent: string,
  sourceUrl: string
): ExtractedSignal {
  const fullText = `${rawTitle} ${rawContent}`;
  const category = classifyDomain(fullText);
  const priority = assessThreatLevel(fullText);
  const tags = extractKeyPhrases(rawTitle);
  const entities = extractEntities(fullText);

  // Augment tags with entity names
  const entityTags = entities.slice(0, 3).map(e => e.name.toLowerCase().replace(/\s+/g, "-"));
  const allTags = [...new Set([...tags, ...entityTags])].slice(0, 8);

  const sourceDomain = (() => {
    try { return new URL(sourceUrl).hostname.replace("www.", ""); } catch { return sourceUrl; }
  })();

  return {
    title: rawTitle.slice(0, 120),
    content: rawContent.slice(0, 800),
    category,
    priority,
    source: sourceDomain,
    tags: allTags,
    seismicRelevance: seismicRelevance(fullText),
    quantumRelevance: quantumRelevance(fullText),
    temporalRelevance: temporalRelevance(fullText),
  };
}

/**
 * Extract the most salient sentence from a body of text.
 */
export function extractLeadSentence(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  if (sentences.length === 0) return text.slice(0, 150);

  // Score each sentence by keyword density
  const scored = sentences.map(s => ({
    text: s.trim(),
    score: ENTITY_NAMES.states.filter(e => s.toLowerCase().includes(e.toLowerCase())).length * 2 +
           Object.values(DOMAIN_KEYWORDS).flat().filter(k => s.toLowerCase().includes(k)).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].text.slice(0, 200);
}

/**
 * Classify priority from content analysis (string output for Zod validation).
 */
export function classifyPriority(text: string): "low" | "medium" | "high" | "critical" {
  return assessThreatLevel(text);
}
