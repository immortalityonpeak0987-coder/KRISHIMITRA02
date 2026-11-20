/**
 * Agricultural Drought & Moisture Stress Risk Service
 * Distinguishes rainfall deficit from confirmed agricultural root-zone moisture stress
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RISK_LEVELS, AGRONOMIC_THRESHOLDS } from './riskConstants.js';

export class DroughtRiskService {
  static assess({ rainfall14DayMm, rootZoneMoisture, isCroppingSeason = true, currentCrop = null }) {
    // If during fallow / non-cropping season, dry conditions are normal
    if (!isCroppingSeason) {
      return {
        category: 'Drought & Moisture Stress',
        level: RISK_LEVELS.LOW,
        indicator: 'Currently outside main active crop growing season (fallow/prep period).',
        source: 'Crop Calendar Context',
        recommendation: 'Conserve residual soil moisture for upcoming seasonal land preparation.',
        limitation: 'Agricultural drought is evaluated primarily during active crop canopy stages.'
      };
    }

    const rain = rainfall14DayMm !== undefined && rainfall14DayMm !== null ? Number(rainfall14DayMm) : null;
    const moisture = rootZoneMoisture !== undefined && rootZoneMoisture !== null ? Number(rootZoneMoisture) : null;

    if (rain === null && moisture === null) {
      return {
        category: 'Drought & Moisture Stress',
        level: RISK_LEVELS.INDETERMINATE,
        indicator: 'Neither recent rainfall nor root-zone soil moisture data is available.',
        source: 'NASA POWER / SMAP',
        recommendation: 'Inspect field soil moisture by hand feeling top 10 cm before scheduling sowing.',
        limitation: 'Insufficient data for moisture stress assessment.'
      };
    }

    // High drought stress: 14 days rain < 5mm AND rootzone moisture < 0.15 cm³/cm³
    if (rain !== null && rain < 5 && moisture !== null && moisture < AGRONOMIC_THRESHOLDS.DROUGHT.ROOTZONE_MOISTURE_CRITICAL) {
      return {
        category: 'Drought & Moisture Stress',
        level: RISK_LEVELS.HIGH,
        indicator: `Severe moisture deficit: 14-day rainfall (${rain} mm) with root-zone soil moisture at ${moisture} cm³/cm³.`,
        source: 'SMAP L4 (Root-Zone) + NASA POWER',
        recommendation: 'Initiate supplemental life-saving irrigation immediately; apply organic mulch to suppress soil evaporation.',
        evidenceUsed: ['Rainfall < 5mm / 14d', 'SMAP root-zone moisture < 0.15']
      };
    }

    if (rain !== null && rain < 10) {
      return {
        category: 'Drought & Moisture Stress',
        level: RISK_LEVELS.MODERATE,
        indicator: `Low rainfall in last 14 days (${rain} mm). Subsoil reserve maintaining canopy for now.`,
        source: 'NASA POWER PRECTOTCORR',
        recommendation: 'Monitor crop leaf rolling in afternoon; prepare irrigation pumps if rain is not forecast.',
        evidenceUsed: ['Rainfall < 10mm / 14d']
      };
    }

    return {
      category: 'Drought & Moisture Stress',
      level: RISK_LEVELS.LOW,
      indicator: 'Rainfall and soil moisture are adequate for current crop growth stage.',
      source: 'NASA POWER / SMAP',
      recommendation: 'Continue regular field monitoring.'
    };
  }
}
