/**
 * ORACLE Synthetic Data Generator
 * 
 * Generates synthetic training data to augment sparse real-world data,
 * particularly for rare but critical events and edge cases.
 */

import { randomUUID } from "crypto";

export interface SyntheticInteraction {
  type: string;
  target: string;
  value: number;
  context: Record<string, unknown>;
  trainingWeight: number;
  isynthetic: boolean;
  generatedAt: Date;
}

export interface GenerationConfig {
  rareEventAugmentationFactor: number;
  contextualVariance: number;
  temporalSpread: boolean;
  domainFocus?: string;
}

/**
 * Generate synthetic seismic pulse interactions for rare events.
 */
export function generateSeismicPulseInteractions(
  count: number,
  config: GenerationConfig
): SyntheticInteraction[] {
  const interactions: SyntheticInteraction[] = [];
  
  for (let i = 0; i < count; i++) {
    const severity = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    const frequency = Math.random() * 20 + 5; // 5 to 25 Hz
    const amplitude = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
    
    // Rare events have higher training weight
    const isRareEvent = Math.random() < 0.2;
    const trainingWeight = isRareEvent 
      ? (2.0 + Math.random() * 1.5) * config.rareEventAugmentationFactor
      : 1.5 + Math.random() * 0.5;

    interactions.push({
      type: 'seismic_pulse',
      target: `seismic_resonance_net_${Math.floor(Math.random() * 5)}`,
      value: severity,
      context: {
        frequency,
        amplitude,
        region: ['pacific', 'atlantic', 'eurasian', 'african'][Math.floor(Math.random() * 4)],
        depth: Math.random() * 700 + 10,
        magnitude: Math.random() * 7 + 3,
        isRareEvent,
        generationStrategy: 'seismic_distribution',
      },
      trainingWeight,
      isynthetic: true,
      generatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    });
  }

  return interactions;
}

/**
 * Generate synthetic quantum collapse interactions.
 */
export function generateQuantumCollapseInteractions(
  count: number,
  config: GenerationConfig
): SyntheticInteraction[] {
  const interactions: SyntheticInteraction[] = [];
  
  for (let i = 0; i < count; i++) {
    const coherence = Math.random() * 0.6 + 0.3; // 0.3 to 0.9
    const observerEffect = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
    const decoherenceRate = Math.random() * 0.04 + 0.01; // 0.01 to 0.05
    
    const isRareEvent = Math.random() < 0.15;
    const trainingWeight = isRareEvent
      ? (1.8 + Math.random() * 1.2) * config.rareEventAugmentationFactor
      : 1.4 + Math.random() * 0.4;

    interactions.push({
      type: 'quantum_collapse',
      target: `quantum_field_predictor_${Math.floor(Math.random() * 5)}`,
      value: coherence,
      context: {
        observerEffect,
        decoherenceRate,
        fieldState: ['entangled', 'superposition', 'collapsed'][Math.floor(Math.random() * 3)],
        measurementBasis: ['x', 'y', 'z'][Math.floor(Math.random() * 3)],
        isRareEvent,
        generationStrategy: 'quantum_distribution',
      },
      trainingWeight,
      isynthetic: true,
      generatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    });
  }

  return interactions;
}

/**
 * Generate synthetic temporal threat observations.
 */
export function generateTemporalObservationInteractions(
  count: number,
  config: GenerationConfig
): SyntheticInteraction[] {
  const interactions: SyntheticInteraction[] = [];
  
  for (let i = 0; i < count; i++) {
    const threatVelocity = Math.random() * 1.8 + 0.8; // 0.8 to 2.6
    const horizon = Math.random() * 60 + 10; // 10 to 70 days
    const cascadeRisk = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
    
    const isRareEvent = Math.random() < 0.1;
    const trainingWeight = isRareEvent
      ? (1.5 + Math.random() * 1.0) * config.rareEventAugmentationFactor
      : 1.3 + Math.random() * 0.3;

    interactions.push({
      type: 'temporal_observe',
      target: `temporal_threat_classifier_${Math.floor(Math.random() * 5)}`,
      value: threatVelocity,
      context: {
        horizon,
        cascadeRisk,
        threatType: ['geopolitical', 'economic', 'cyber', 'climate'][Math.floor(Math.random() * 4)],
        timeScale: ['hours', 'days', 'weeks'][Math.floor(Math.random() * 3)],
        isRareEvent,
        generationStrategy: 'temporal_distribution',
      },
      trainingWeight,
      isynthetic: true,
      generatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    });
  }

  return interactions;
}

/**
 * Generate synthetic anomaly flagging interactions.
 */
export function generateAnomalyFlagInteractions(
  count: number,
  config: GenerationConfig
): SyntheticInteraction[] {
  const interactions: SyntheticInteraction[] = [];
  
  for (let i = 0; i < count; i++) {
    const severity = Math.random() * 0.9 + 0.1; // 0.1 to 1.0
    const confidence = Math.random() * 0.7 + 0.3; // 0.3 to 1.0
    
    const isRareEvent = severity > 0.8;
    const trainingWeight = isRareEvent
      ? (1.6 + Math.random() * 1.0) * config.rareEventAugmentationFactor
      : 1.2 + Math.random() * 0.3;

    interactions.push({
      type: 'anomaly_flag',
      target: `anomaly_detector_${Math.floor(Math.random() * 5)}`,
      value: severity,
      context: {
        confidence,
        anomalyType: ['statistical', 'behavioral', 'structural', 'temporal'][Math.floor(Math.random() * 4)],
        domain: ['signals', 'entities', 'predictions'][Math.floor(Math.random() * 3)],
        isRareEvent,
        generationStrategy: 'anomaly_distribution',
      },
      trainingWeight,
      isynthetic: true,
      generatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    });
  }

  return interactions;
}

/**
 * Generate synthetic query interactions for NLP training.
 */
export function generateQueryInteractions(
  count: number,
  config: GenerationConfig
): SyntheticInteraction[] {
  const interactions: SyntheticInteraction[] = [];
  
  const queryTemplates = [
    'What are the current seismic patterns?',
    'Analyze quantum field anomalies',
    'Predict temporal threats in the next 30 days',
    'Show me critical anomalies',
    'What is the system accuracy?',
    'Explain the latest training cycle',
    'Generate predictions for entity X',
    'What signals indicate geopolitical risk?',
  ];

  for (let i = 0; i < count; i++) {
    const template = queryTemplates[Math.floor(Math.random() * queryTemplates.length)];
    const complexity = Math.random() * 0.6 + 0.4; // 0.4 to 1.0
    
    const trainingWeight = 1.3 + Math.random() * 0.5;

    interactions.push({
      type: 'query',
      target: 'oracle_nlp_engine',
      value: complexity,
      context: {
        queryTemplate: template,
        domain: ['seismic', 'quantum', 'temporal', 'general'][Math.floor(Math.random() * 4)],
        complexity,
        generationStrategy: 'nlp_distribution',
      },
      trainingWeight,
      isynthetic: true,
      generatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    });
  }

  return interactions;
}

/**
 * Generate synthetic signal rating interactions.
 */
export function generateSignalRatingInteractions(
  count: number,
  config: GenerationConfig
): SyntheticInteraction[] {
  const interactions: SyntheticInteraction[] = [];
  
  for (let i = 0; i < count; i++) {
    const rating = Math.floor(Math.random() * 5) + 1; // 1 to 5
    const relevance = rating / 5; // 0.2 to 1.0
    
    const trainingWeight = 1.4 + (rating / 5) * 0.5;

    interactions.push({
      type: 'signal_rate',
      target: `signal_${Math.floor(Math.random() * 1000)}`,
      value: relevance,
      context: {
        rating,
        domain: ['geopolitical', 'economic', 'cyber', 'climate', 'biological'][Math.floor(Math.random() * 5)],
        source: ['news', 'social', 'scientific', 'financial'][Math.floor(Math.random() * 4)],
        generationStrategy: 'signal_distribution',
      },
      trainingWeight,
      isynthetic: true,
      generatedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    });
  }

  return interactions;
}

/**
 * Generate a balanced synthetic dataset for domain-specific training.
 */
export function generateBalancedSyntheticDataset(
  totalCount: number,
  config: GenerationConfig
): SyntheticInteraction[] {
  const distribution = {
    seismic_pulse: Math.floor(totalCount * 0.25),
    quantum_collapse: Math.floor(totalCount * 0.20),
    temporal_observe: Math.floor(totalCount * 0.20),
    anomaly_flag: Math.floor(totalCount * 0.15),
    query: Math.floor(totalCount * 0.12),
    signal_rate: totalCount - (Math.floor(totalCount * 0.25) + Math.floor(totalCount * 0.20) + Math.floor(totalCount * 0.20) + Math.floor(totalCount * 0.15) + Math.floor(totalCount * 0.12)),
  };

  const dataset: SyntheticInteraction[] = [];

  dataset.push(...generateSeismicPulseInteractions(distribution.seismic_pulse, config));
  dataset.push(...generateQuantumCollapseInteractions(distribution.quantum_collapse, config));
  dataset.push(...generateTemporalObservationInteractions(distribution.temporal_observe, config));
  dataset.push(...generateAnomalyFlagInteractions(distribution.anomaly_flag, config));
  dataset.push(...generateQueryInteractions(distribution.query, config));
  dataset.push(...generateSignalRatingInteractions(distribution.signal_rate, config));

  // Shuffle the dataset
  return dataset.sort(() => Math.random() - 0.5);
}

/**
 * Compute dataset statistics for quality assessment.
 */
export function computeDatasetStatistics(dataset: SyntheticInteraction[]) {
  const typeCounts: Record<string, number> = {};
  const typeWeights: Record<string, number> = {};
  const rareEventCounts: Record<string, number> = {};

  for (const interaction of dataset) {
    typeCounts[interaction.type] = (typeCounts[interaction.type] ?? 0) + 1;
    typeWeights[interaction.type] = (typeWeights[interaction.type] ?? 0) + interaction.trainingWeight;
    
    if (interaction.context.isRareEvent) {
      rareEventCounts[interaction.type] = (rareEventCounts[interaction.type] ?? 0) + 1;
    }
  }

  return {
    totalCount: dataset.length,
    typeDistribution: typeCounts,
    averageWeightByType: Object.fromEntries(
      Object.entries(typeWeights).map(([type, weight]) => [type, weight / (typeCounts[type] ?? 1)])
    ),
    rareEventDistribution: rareEventCounts,
    rareEventPercentage: (Object.values(rareEventCounts).reduce((a, b) => a + b, 0) / dataset.length) * 100,
  };
}
