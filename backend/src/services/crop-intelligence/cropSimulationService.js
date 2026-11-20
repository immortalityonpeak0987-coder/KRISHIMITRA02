/**
 * What-If Climate & Sowing Delay Scenario Simulator
 * Matches frontend cropService.simulateClimateScenario contract
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

export class CropSimulationService {
  static simulate({ farmId, tempOffsetCelsius = 0, rainfallOffsetPercent = 0, sowingDelayDays = 0 }) {
    const delay = parseInt(sowingDelayDays, 10) || 0;
    const tempChange = parseFloat(tempOffsetCelsius) || 0;
    const rainChange = parseInt(rainfallOffsetPercent, 10) || 0;

    let waterStressVerdict = 'Stable';
    let harvestWindowVerdict = 'On Schedule';
    let vulnerabilityScore = 20;

    if (delay > 15) {
      harvestWindowVerdict = 'Critical Shift: Late sowing pushes reproductive filling into severe dry heat in late winter/spring.';
      vulnerabilityScore += 35;
    } else if (delay > 7) {
      harvestWindowVerdict = 'Moderate Shift: Harvest window compressed by approximately 1–2 weeks.';
      vulnerabilityScore += 15;
    }

    if (rainChange < -20) {
      waterStressVerdict = 'Severe Irrigation Deficit: Groundwater table extraction and supplemental pumping required.';
      vulnerabilityScore += 30;
    } else if (rainChange > 25) {
      waterStressVerdict = 'Excess Moisture Risk: Standing water in field furrows may cause root rot or tuber damping-off.';
      vulnerabilityScore += 25;
    }

    if (tempChange > 1.5) {
      vulnerabilityScore += 20;
    }

    return {
      farmId,
      scenarioLabel: `Simulated: ${tempChange > 0 ? '+' : ''}${tempChange}°C, ${rainChange > 0 ? '+' : ''}${rainChange}% Rain, ${delay} Days Sowing Delay`,
      vulnerabilityIndex: Math.min(100, vulnerabilityScore),
      waterStressVerdict,
      harvestWindowVerdict,
      suggestedAdjustment: delay > 10
        ? 'Switch to short-duration cultivars (e.g. Kufri Pukhraj potato: 75 days; or Pusa Vishal moong) to evade terminal seasonal heat stress.'
        : 'Maintain standard crop calendar with regular soil moisture monitoring.',
      isSimulation: true,
      disclaimer: 'This is a deterministic decision-support scenario simulator for contingency planning, NOT an absolute weather forecast.'
    };
  }
}
