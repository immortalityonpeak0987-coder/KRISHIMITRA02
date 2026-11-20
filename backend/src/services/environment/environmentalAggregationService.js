/**
 * Environmental Aggregation Service (Daily, Weekly, Monthly, Seasonal)
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { STANDARD_PARAMETERS } from './environmentalConstants.js';

export class EnvironmentalAggregationService {
  static aggregate(observations, options = {}) {
    const {
      aggregation = 'daily',
      startDate,
      endDate,
      expectedDays = null
    } = options;

    if (!Array.isArray(observations) || observations.length === 0) {
      return {
        aggregation,
        startDate: startDate || null,
        endDate: endDate || null,
        totalObservations: 0,
        completenessPercent: 0,
        isComplete: false,
        metrics: {}
      };
    }

    // Group observations by parameter
    const grouped = {};
    for (const obs of observations) {
      if (!grouped[obs.parameter]) {
        grouped[obs.parameter] = [];
      }
      grouped[obs.parameter].push(obs);
    }

    const metrics = {};

    for (const [param, obsList] of Object.entries(grouped)) {
      const validVals = obsList
        .filter(o => o.standardizedValue !== null && o.standardizedValue !== undefined)
        .map(o => o.standardizedValue);

      const totalCount = obsList.length;
      const validCount = validVals.length;
      const missingCount = totalCount - validCount;

      if (validCount === 0) {
        metrics[param] = {
          count: totalCount,
          validCount: 0,
          missingCount,
          unit: obsList[0]?.standardizedUnit || null,
          sum: null,
          mean: null,
          min: null,
          max: null,
          completenessPercent: 0,
          qualityNote: 'No valid observations in aggregation period.'
        };
        continue;
      }

      const sum = validVals.reduce((a, b) => a + b, 0);
      const min = Math.min(...validVals);
      const max = Math.max(...validVals);
      const mean = Math.round((sum / validCount) * 100) / 100;

      const compPercent = expectedDays
        ? Math.min(100, Math.round((validCount / expectedDays) * 100))
        : Math.round((validCount / totalCount) * 100);

      // Parameter-specific primary aggregation metric
      let primaryValue = mean;
      if (param === STANDARD_PARAMETERS.RAINFALL_ACCUMULATION) {
        primaryValue = Math.round(sum * 100) / 100;
      }

      metrics[param] = {
        count: totalCount,
        validCount,
        missingCount,
        unit: obsList[0].standardizedUnit,
        primaryValue,
        sum: Math.round(sum * 100) / 100,
        mean,
        min,
        max,
        completenessPercent: compPercent,
        isSufficientCoverage: compPercent >= 80,
        sources: Array.from(new Set(obsList.map(o => o.source)))
      };
    }

    const totalDays = expectedDays || observations.length;
    const avgCompleteness = Object.values(metrics).reduce((acc, m) => acc + (m.completenessPercent || 0), 0) / (Object.keys(metrics).length || 1);

    return {
      aggregation,
      startDate: startDate || null,
      endDate: endDate || null,
      totalObservations: observations.length,
      completenessPercent: Math.round(avgCompleteness),
      isComplete: avgCompleteness >= 80,
      metrics
    };
  }
}
