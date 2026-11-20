/**
 * Waterlogging & Ponding Risk Service
 * Requires multi-factor evidence: rainfall + soil texture/drainage + topography
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RISK_LEVELS } from './riskConstants.js';

export class WaterloggingRiskService {
  static assess({ rainfall7DayMm, soilType, farmType, topography, farmerGroundEvidence }) {
    const rain = Number(rainfall7DayMm) || 0;
    const soil = String(soilType || '').toLowerCase();
    const isClay = soil.includes('clay') || soil.includes('heavy');
    const isCoastalLowland = String(farmType || '').toLowerCase().includes('lowland') || (topography && topography.isLowland);

    // Scientific rule: High rainfall alone does not prove ponding, nor does clay alone prove waterlogging
    if (rain < 50 && !farmerGroundEvidence) {
      return {
        category: 'Flood & Waterlogging',
        level: RISK_LEVELS.LOW,
        indicator: 'Accumulated rainfall is low; standing water unlikely in current conditions.',
        source: 'NASA GPM IMERG + Soil Baseline',
        recommendation: 'Maintain standard field furrows between crop beds.',
        evidenceUsed: ['Rainfall < 50mm']
      };
    }

    if (rain >= 150 && isClay && isCoastalLowland) {
      return {
        category: 'Flood & Waterlogging',
        level: RISK_LEVELS.HIGH,
        indicator: `High rainfall (${Math.round(rain)} mm) combined with heavy clay texture and lowland delta elevation creates acute standing water risk.`,
        source: 'NASA GPM IMERG + Farm Topography / Soil Baseline',
        recommendation: 'Operate sluice gates, dig perimeter drainage channels, and elevate nursery beds.',
        evidenceUsed: ['Rainfall >= 150mm', 'Heavy Clay Soil', 'Lowland Topography']
      };
    }

    if (rain >= 100) {
      return {
        category: 'Flood & Waterlogging',
        level: RISK_LEVELS.MODERATE,
        indicator: `Moderate standing water risk (${Math.round(rain)} mm in 7 days). Local drainage efficiency is critical.`,
        source: 'NASA GPM IMERG + Field Topography',
        recommendation: 'Inspect secondary farm bunds and ensure outlet gates are unobstructed.',
        evidenceUsed: ['Rainfall >= 100mm'],
        limitation: 'Ground drainage capacity unverified; confirm localized ponding in low-lying field corners.'
      };
    }

    return {
      category: 'Flood & Waterlogging',
      level: RISK_LEVELS.LOW,
      indicator: `Accumulated rainfall (${Math.round(rain)} mm) is manageable with standard drainage gradient.`,
      source: 'NASA GPM IMERG + Soil Baseline',
      recommendation: 'Standard field bed management is sufficient.',
      evidenceUsed: ['Manageable rainfall']
    };
  }
}
