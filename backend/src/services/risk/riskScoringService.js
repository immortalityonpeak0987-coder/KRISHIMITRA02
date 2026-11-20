/**
 * Compound Risk Scoring & Synthesis Service
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RISK_LEVELS } from './riskConstants.js';

export class RiskScoringService {
  static synthesize(riskFactors) {
    if (!Array.isArray(riskFactors) || riskFactors.length === 0) {
      return {
        overallRiskLevel: 'Indeterminate',
        riskLevelEnum: RISK_LEVELS.INDETERMINATE,
        score: null,
        summary: 'No risk screenings available.'
      };
    }

    const levels = riskFactors.map(f => f.level);

    if (levels.includes(RISK_LEVELS.SEVERE)) {
      return {
        overallRiskLevel: 'Severe (Immediate Hazard)',
        riskLevelEnum: RISK_LEVELS.SEVERE,
        score: 85,
        summary: 'Critical hazard detected requiring active field mitigation.'
      };
    }

    if (levels.includes(RISK_LEVELS.HIGH)) {
      return {
        overallRiskLevel: 'High Vulnerability',
        riskLevelEnum: RISK_LEVELS.HIGH,
        score: 70,
        summary: 'High risk conditions present. Protective agricultural interventions recommended.'
      };
    }

    if (levels.includes(RISK_LEVELS.MODERATE)) {
      return {
        overallRiskLevel: 'Low to Moderate',
        riskLevelEnum: RISK_LEVELS.MODERATE,
        score: 45,
        summary: 'Moderate climate vulnerability. Routine monitoring and maintenance advised.'
      };
    }

    if (levels.every(l => l === RISK_LEVELS.INDETERMINATE)) {
      return {
        overallRiskLevel: 'Indeterminate (Insufficient Data)',
        riskLevelEnum: RISK_LEVELS.INDETERMINATE,
        score: null,
        summary: 'Insufficient environmental or ground observations for risk determination.'
      };
    }

    return {
      overallRiskLevel: 'Low',
      riskLevelEnum: RISK_LEVELS.LOW,
      score: 20,
      summary: 'Optimal conditions observed across monitored hazards.'
    };
  }
}
