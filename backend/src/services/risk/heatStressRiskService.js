/**
 * Heat Stress & High Temperature Exposure Risk Service
 * Evaluates consecutive days exceeding crop critical thresholds
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RISK_LEVELS, AGRONOMIC_THRESHOLDS } from './riskConstants.js';

export class HeatStressRiskService {
  static assess(dailyMaxTemps, currentCrop = '') {
    if (!Array.isArray(dailyMaxTemps) || dailyMaxTemps.length === 0) {
      return {
        category: 'Seasonal Temperature & Heat Stress',
        level: RISK_LEVELS.INDETERMINATE,
        indicator: 'No recent maximum temperature observations available.',
        source: 'NASA POWER T2M_MAX',
        recommendation: 'Check local weather station reports for thermal alerts.',
        limitation: 'Missing temperature data.'
      };
    }

    const validTemps = dailyMaxTemps
      .filter(t => t !== null && t !== undefined && !Number.isNaN(Number(t)))
      .map(t => Number(t));

    if (validTemps.length === 0) {
      return {
        category: 'Seasonal Temperature & Heat Stress',
        level: RISK_LEVELS.INDETERMINATE,
        indicator: 'All temperature observations were missing.',
        source: 'NASA POWER T2M_MAX',
        recommendation: 'Awaiting station telemetry.',
        limitation: 'Missing temperature values.'
      };
    }

    const cropName = String(currentCrop || '').toLowerCase();
    let threshold = AGRONOMIC_THRESHOLDS.HEAT_STRESS.DEFAULT_MAX_TEMP;

    if (cropName.includes('potato')) {
      threshold = AGRONOMIC_THRESHOLDS.HEAT_STRESS.POTATO_CRITICAL_MAX_TEMP;
    } else if (cropName.includes('wheat') || cropName.includes('mustard')) {
      threshold = AGRONOMIC_THRESHOLDS.HEAT_STRESS.WHEAT_CRITICAL_MAX_TEMP;
    }

    // Count consecutive or peak days above threshold
    let consecutiveAbove = 0;
    let maxConsecutive = 0;
    for (const temp of validTemps) {
      if (temp >= threshold) {
        consecutiveAbove++;
        if (consecutiveAbove > maxConsecutive) maxConsecutive = consecutiveAbove;
      } else {
        consecutiveAbove = 0;
      }
    }

    const peakTemp = Math.max(...validTemps);

    if (maxConsecutive >= AGRONOMIC_THRESHOLDS.HEAT_STRESS.CONSECUTIVE_DAYS || peakTemp >= threshold + 4.0) {
      return {
        category: 'Seasonal Temperature & Heat Stress',
        level: RISK_LEVELS.HIGH,
        indicator: `Critical thermal exposure: Peak temp ${peakTemp}°C with ${maxConsecutive} consecutive days exceeding ${threshold}°C threshold for ${currentCrop || 'sensitive crops'}.`,
        source: 'NASA POWER T2M_MAX 10-Year Climatology & Recent Ingestion',
        recommendation: 'Provide light evening irrigation to cool microclimate; apply potassium spray to enhance cellular turgor.'
      };
    }

    if (peakTemp >= threshold) {
      return {
        category: 'Seasonal Temperature & Heat Stress',
        level: RISK_LEVELS.MODERATE,
        indicator: `Elevated temperatures: Peak ${peakTemp}°C reached crop sensitivity threshold (${threshold}°C).`,
        source: 'NASA POWER T2M_MAX',
        recommendation: 'Ensure soil moisture is maintained to avoid combined drought-heat stress.'
      };
    }

    return {
      category: 'Seasonal Temperature & Heat Stress',
      level: RISK_LEVELS.LOW,
      indicator: `Temperatures favorable: Peak max temp ${peakTemp}°C is well within safe physiological range (threshold: ${threshold}°C).`,
      source: 'NASA POWER T2M_MIN & T2M_MAX',
      recommendation: 'Optimal temperature window for active growth and reproductive emergence.'
    };
  }
}
