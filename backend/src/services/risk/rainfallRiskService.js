/**
 * Excess Rainfall & Precipitation Anomaly Risk Service
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RISK_LEVELS, AGRONOMIC_THRESHOLDS } from './riskConstants.js';

export class RainfallRiskService {
  static assess(rainfallObservations, options = {}) {
    if (!Array.isArray(rainfallObservations) || rainfallObservations.length === 0) {
      return {
        category: 'Excess Rainfall',
        level: RISK_LEVELS.INDETERMINATE,
        indicator: 'No recent rainfall observations available.',
        source: 'NASA POWER / IMD / GPM IMERG',
        recommendation: 'Check local rain gauge readings before field operations.',
        dataCompleteness: 0,
        limitation: 'Insufficient temporal rainfall series for risk determination.'
      };
    }

    const validVals = rainfallObservations
      .filter(o => o.standardizedValue !== null && o.standardizedValue !== undefined)
      .map(o => o.standardizedValue);

    if (validVals.length === 0) {
      return {
        category: 'Excess Rainfall',
        level: RISK_LEVELS.INDETERMINATE,
        indicator: 'All recent rainfall observations were missing/null fill values.',
        source: 'NASA POWER / IMD / GPM IMERG',
        recommendation: 'Awaiting updated satellite or station telemetry.',
        dataCompleteness: 0,
        limitation: 'Missing observation values.'
      };
    }

    const sum7Day = validVals.slice(0, 7).reduce((a, b) => a + b, 0);
    const maxDaily = Math.max(...validVals);

    let level = RISK_LEVELS.LOW;
    let indicator = `Recent 7-day accumulation: ${Math.round(sum7Day * 10) / 10} mm. Precipitation within normal seasonal absorption bounds.`;
    let recommendation = 'Normal irrigation schedule may proceed.';

    if (sum7Day >= AGRONOMIC_THRESHOLDS.EXCESS_RAINFALL.SEVERE_7DAY_MM || maxDaily >= 150) {
      level = RISK_LEVELS.SEVERE;
      indicator = `Extreme rainfall: ${Math.round(sum7Day)} mm accumulated in 7 days (Peak single-day: ${maxDaily} mm).`;
      recommendation = 'Immediate drainage intervention required; clear secondary outlet trenches to prevent crop submergence.';
    } else if (sum7Day >= AGRONOMIC_THRESHOLDS.EXCESS_RAINFALL.HIGH_7DAY_MM || maxDaily >= AGRONOMIC_THRESHOLDS.EXCESS_RAINFALL.DAILY_EXTREME_MM) {
      level = RISK_LEVELS.HIGH;
      indicator = `Heavy rainfall: ${Math.round(sum7Day)} mm in 7 days. Soil saturation exceeded.`;
      recommendation = 'Suspend fertilizer application and postpone mechanical tillage until moisture recedes.';
    } else if (sum7Day >= AGRONOMIC_THRESHOLDS.EXCESS_RAINFALL.MODERATE_7DAY_MM) {
      level = RISK_LEVELS.MODERATE;
      indicator = `Moderate wet spell: ${Math.round(sum7Day)} mm in 7 days.`;
      recommendation = 'Inspect field bunds and maintain active drainage furrows.';
    }

    return {
      category: 'Excess Rainfall',
      level,
      indicator,
      source: rainfallObservations[0]?.source || 'NASA GPM IMERG / NASA POWER',
      recommendation,
      metrics: {
        sum7Day: Math.round(sum7Day * 10) / 10,
        maxDaily: Math.round(maxDaily * 10) / 10,
        observationCount: validVals.length
      }
    };
  }
}
