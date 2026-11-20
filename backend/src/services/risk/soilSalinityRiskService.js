/**
 * Soil Salinity Risk Service
 * Strictly requires verified SoilTest laboratory measurements in dS/m
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RISK_LEVELS, AGRONOMIC_THRESHOLDS } from './riskConstants.js';

export class SoilSalinityRiskService {
  static assess(soilTestRecord) {
    if (!soilTestRecord || !soilTestRecord.electricalConductivity || soilTestRecord.electricalConductivity.value === null || soilTestRecord.electricalConductivity.value === undefined) {
      return {
        category: 'Coastal Soil Salinity',
        level: RISK_LEVELS.INDETERMINATE,
        indicator: 'No verified soil laboratory electrical conductivity (ECe) measurement on record.',
        source: 'Soil Testing Laboratory Record (Required)',
        recommendation: 'Conduct a certified laboratory soil test before dry-season sowing. Do not rely on geographic assumptions.',
        limitation: 'NASA POWER and optical satellite indices do not directly measure soil electrical conductivity. EC cannot be inferred without chemical test.'
      };
    }

    const ec = Number(soilTestRecord.electricalConductivity.value);
    const unit = soilTestRecord.electricalConductivity.unit || 'dS/m';
    const isLab = Boolean(soilTestRecord.isVerifiedLab);
    const labName = soilTestRecord.laboratoryName || 'Uncertified Lab Record';

    if (ec > AGRONOMIC_THRESHOLDS.SALINITY_ECE.HIGH_MAX) {
      return {
        category: 'Coastal Soil Salinity',
        level: RISK_LEVELS.SEVERE,
        indicator: `Severe soil salinity: ECe ${ec} ${unit} (${labName}). Lethal to non-halophyte crops.`,
        source: `Soil Test Lab: ${labName}`,
        recommendation: 'Only highly salt-tolerant cultivars or brackish aquaculture viable. Extensive leaching with sweet monsoon water required.'
      };
    }

    if (ec > AGRONOMIC_THRESHOLDS.SALINITY_ECE.MODERATE_MAX) {
      return {
        category: 'Coastal Soil Salinity',
        level: RISK_LEVELS.HIGH,
        indicator: `High soil salinity: ECe ${ec} ${unit} (${labName}). Capillary rise accelerates in dry winter months.`,
        source: `Soil Test Lab: ${labName}`,
        recommendation: 'Avoid water-intensive Boro rice; adopt relay grass pea (Khesari) or thick straw mulch to retard capillary evaporation.'
      };
    }

    if (ec > AGRONOMIC_THRESHOLDS.SALINITY_ECE.SAFE_MAX) {
      return {
        category: 'Coastal Soil Salinity',
        level: RISK_LEVELS.MODERATE,
        indicator: `Moderate soil salinity: ECe ${ec} ${unit} (${labName}). Yield reduction possible in sensitive pulses/vegetables.`,
        source: `Soil Test Lab: ${labName}`,
        recommendation: 'Select moderately tolerant varieties (e.g. CSR series paddy or mustard); avoid saline pond irrigation.'
      };
    }

    return {
      category: 'Coastal Soil Salinity',
      level: RISK_LEVELS.LOW,
      indicator: `Soil salinity safe: ECe ${ec} ${unit} (${labName}) is well within non-saline agricultural threshold (< 2.0 dS/m).`,
      source: `Soil Test Lab: ${labName}`,
      recommendation: 'Standard crop agronomy applicable; no special desalinization measures needed.'
    };
  }
}
