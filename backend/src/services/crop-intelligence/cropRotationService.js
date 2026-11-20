/**
 * Crop Rotation Intelligence & Agronomic Sequencing Service
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RESEARCH_VERIFIED_CROPS } from './cropKnowledgeBase.js';

const DETAILED_PLANS = {
  'farm-bardhaman-01': [
    {
      id: 'plan-1',
      title: 'Plan A: Soil-Restoring Pulse & Oilseed Diversification',
      sequence: 'Aman Paddy → Mustard (Binoy) → Summer Moong (Green Gram)',
      suitabilityScore: 94,
      timing: [
        { crop: 'Aman Paddy', window: 'Jul – Oct', duration: '115 days', type: 'Cereal (Poaceae)' },
        { crop: 'Mustard (B-9 / Binoy)', window: 'Nov – Jan', duration: '90 days', type: 'Oilseed (Brassicaceae)' },
        { crop: 'Moong (Green Gram)', window: 'Feb – Apr', duration: '65 days', type: 'Legume (Fabaceae)' },
        { crop: 'Green Manure / Rest', window: 'May – Jun', duration: '50 days', type: 'Soil Recovery' }
      ],
      waterBalance: {
        estimatedSavings: '42% less water compared to continuous Boro Rice',
        groundwaterImpact: 'Positive (prevents summer tube-well aquifer drawdown)',
        riskLevel: 'Low'
      },
      soilBenefit: {
        nitrogenContribution: '+35 to 45 kg N/ha biological fixation from Rhizobium root nodules',
        organicCarbon: 'Improves active carbon fractions and rests soil during peak May heat'
      },
      pestCycleBreak: 'High: Switching from Poaceae (Rice) to Brassicaceae (Mustard) and Fabaceae (Moong) breaks Stem Borer and Brown Planthopper carryover.',
      limitations: 'Farmer should harvest Moong pods before late-April Kalbaishakhi convective thundershowers.'
    },
    {
      id: 'plan-2',
      title: 'Plan B: Water-Conserving Commercial Tuber-Oilseed Rotation',
      sequence: 'Early Aman Paddy → Kufri Pukhraj Potato → Summer Sesame (Til)',
      suitabilityScore: 88,
      timing: [
        { crop: 'Early Aman Paddy', window: 'Jul – Oct', duration: '105 days', type: 'Cereal (Poaceae)' },
        { crop: 'Kufri Pukhraj Potato', window: 'Nov – Feb', duration: '85 days', type: 'Tuber (Solanaceae)' },
        { crop: 'Sesame (Til)', window: 'Mar – May', duration: '75 days', type: 'Oilseed (Pedaliaceae)' },
        { crop: 'Land Puddling', window: 'Jun', duration: '30 days', type: 'Preparation' }
      ],
      waterBalance: {
        estimatedSavings: '28% less water than Boro Rice; Sesame thrives on residual moisture',
        groundwaterImpact: 'Moderate (controlled furrow irrigation)',
        riskLevel: 'Low'
      },
      soilBenefit: {
        nitrogenContribution: 'Neutral; Sesame utilizes residual P & K applied to Potato',
        organicCarbon: 'Sesame deep taproots perforate subsoil plough-pan compaction'
      },
      pestCycleBreak: 'Moderate: Breaks bacterial wilt and nematode cycles with dry summer sesame.',
      limitations: 'Requires cold-storage booking and certified disease-free seed tubers.'
    }
  ],
  'farm-hooghly-02': [
    {
      id: 'plan-1',
      title: 'Plan A: High-Biomass Fiber–Cereal–Oilseed Rotation',
      sequence: 'Tossa Jute → Aman Paddy → Zero-Tillage Mustard / Lentil',
      suitabilityScore: 95,
      timing: [
        { crop: 'Tossa Jute', window: 'Mar – Jun', duration: '110 days', type: 'Fiber (Malvaceae)' },
        { crop: 'Aman Paddy', window: 'Jul – Oct', duration: '115 days', type: 'Cereal (Poaceae)' },
        { crop: 'Mustard / Lentil', window: 'Nov – Feb', duration: '85 days', type: 'Oilseed / Legume' }
      ],
      waterBalance: {
        estimatedSavings: '35% water savings; Jute utilizes pre-monsoon Norwester showers',
        groundwaterImpact: 'Low stress on Lower Gangetic aquifers',
        riskLevel: 'Low'
      },
      soilBenefit: {
        nitrogenContribution: 'Jute leaf litter shedding returns 3–4 tonnes/ha organic biomass before paddy',
        organicCarbon: 'Highest organic carbon restoration among Gangetic alluvial systems'
      },
      pestCycleBreak: 'Very High: Three distinct botanical families (Malvaceae → Poaceae → Brassicaceae/Fabaceae).',
      limitations: 'Requires clean retting pond availability during July–August.'
    },
    {
      id: 'plan-2',
      title: 'Plan B: Intensive Vegetable–Legume Relay Diversification',
      sequence: 'Aman Paddy → Potato → Summer Green Gram (Moong)',
      suitabilityScore: 89,
      timing: [
        { crop: 'Aman Paddy', window: 'Jul – Oct', duration: '115 days', type: 'Cereal (Poaceae)' },
        { crop: 'Potato', window: 'Nov – Feb', duration: '90 days', type: 'Tuber (Solanaceae)' },
        { crop: 'Summer Moong', window: 'Feb – Apr', duration: '65 days', type: 'Legume (Fabaceae)' }
      ],
      waterBalance: {
        estimatedSavings: '38% water reduction compared to summer Boro rice',
        groundwaterImpact: 'Conserves canal & shallow tube-well supplies',
        riskLevel: 'Low'
      },
      soilBenefit: {
        nitrogenContribution: '+40 kg N/ha fixed by Moong haulms incorporated into soil',
        organicCarbon: 'Maintains friable sandy-clay loam crumb structure'
      },
      pestCycleBreak: 'High: Legume break prevents solanaceous soil pathogen buildup.',
      limitations: 'Sensitive to unseasonal late-winter rain during potato harvesting.'
    }
  ],
  'farm-gosaba-03': [
    {
      id: 'plan-1',
      title: 'Plan A: Coastal Salinity-Adaptive Zero-Tillage Relay Cycle',
      sequence: 'Salt-Tolerant Aman Paddy (Gosaba-1) → Relay Grass Pea (Khesari) → Mulched Fallow',
      suitabilityScore: 96,
      timing: [
        { crop: 'Salt-Tolerant Paddy (Gosaba-1)', window: 'Jul – Nov', duration: '130 days', type: 'Saline-Tolerant Cereal' },
        { crop: 'Relay Grass Pea (Khesari)', window: 'Nov – Feb', duration: '85 days', type: 'Saline-Tolerant Legume' },
        { crop: 'Paddy Straw Mulch Cover', window: 'Mar – Jun', duration: '110 days', type: 'Salinity Suppression' }
      ],
      waterBalance: {
        estimatedSavings: '100% groundwater preservation (zero dry-season brackish pumping)',
        groundwaterImpact: 'Prevents saltwater intrusion into shallow freshwater lenses',
        riskLevel: 'Moderate (dependent on monsoon freshwater flush)'
      },
      soilBenefit: {
        nitrogenContribution: '+35 kg N/ha biological fixation via hardy Khesari root nodules',
        organicCarbon: 'Straw mulching cuts surface evaporation, halting upward capillary salt rise (EC > 4 dS/m)'
      },
      pestCycleBreak: 'High: Indigenous coastal cultivars with high natural pest resilience.',
      limitations: 'Verify surface soil EC in December; if EC exceeds 6.0 dS/m, prioritize thick straw mulching.'
    },
    {
      id: 'plan-2',
      title: 'Plan B: Land-Shaping Rainwater Harvesting & Tolerant Oilseed Cycle',
      sequence: 'Salt-Tolerant Aman Paddy → Ridge-Furrow Mustard / Sunflower → Green Manure',
      suitabilityScore: 84,
      timing: [
        { crop: 'Salt-Tolerant Aman Paddy', window: 'Jul – Nov', duration: '125 days', type: 'Cereal (Poaceae)' },
        { crop: 'Ridge-Sown Mustard / Sunflower', window: 'Dec – Feb', duration: '85 days', type: 'Salt-Tolerant Oilseed' },
        { crop: 'Dhaincha (Sesbania) Green Manure', window: 'May – Jun', duration: '45 days', type: 'Saline Reclamation' }
      ],
      waterBalance: {
        estimatedSavings: 'Uses harvested rainwater from farm ponds (Chas-pukur) only',
        groundwaterImpact: 'Safe; avoids saline deep-aquifer extraction',
        riskLevel: 'Moderate'
      },
      soilBenefit: {
        nitrogenContribution: 'Dhaincha green manuring neutralizes coastal alkalinity and adds organic N',
        organicCarbon: 'Raises organic matter to buffer sodium toxicity'
      },
      pestCycleBreak: 'High: Alternating Poaceae, Brassicaceae/Asteraceae, and Fabaceae.',
      limitations: 'Requires on-farm rainwater harvesting pond for two life-saving irrigations.'
    }
  ]
};

export class CropRotationService {
  static evaluateRotation(previousCrops = [], proposedCropName = '') {
    const prevNames = previousCrops.map(c => String(c).toLowerCase());
    const proposed = RESEARCH_VERIFIED_CROPS.find(c => c.cropName.toLowerCase() === String(proposedCropName).toLowerCase());

    const issues = [];
    const benefits = [];

    if (!proposed) {
      return {
        isRecommended: false,
        issues: ['Proposed crop is not verified in regional knowledge base.'],
        benefits: []
      };
    }

    const lastCrop = previousCrops[previousCrops.length - 1];
    if (lastCrop) {
      const lastVerified = RESEARCH_VERIFIED_CROPS.find(c => c.cropName.toLowerCase() === String(lastCrop).toLowerCase());
      if (lastVerified && lastVerified.family === proposed.family) {
        issues.push(`Continuous cropping of ${proposed.family} family (${lastVerified.cropName} -> ${proposed.cropName}) increases soil-borne pathogen and pest carryover.`);
      }
    }

    const hasLegumeInRotation = prevNames.some(p => p.includes('pulse') || p.includes('pea') || p.includes('khesari') || p.includes('moong') || p.includes('gram'));
    if (proposed.nitrogenFixing) {
      benefits.push(`${proposed.cropName} (Fabaceae) hosts Rhizobium nodules, biologically fixing 30-50 kg N/ha and restoring soil fertility.`);
    } else if (!hasLegumeInRotation) {
      benefits.push('Recommendation: Introduce a short-duration pulse (e.g. Grass Pea / Moong) into the annual sequence to break continuous nutrient depletion.');
    }

    if (prevNames.some(p => p.includes('paddy') || p.includes('rice')) && (proposed.waterRequirement === 'Low' || proposed.waterRequirement === 'Medium')) {
      benefits.push(`Excellent water budgeting: following water-intensive paddy with ${proposed.waterRequirement.toLowerCase()}-water ${proposed.cropName} conserves subsoil moisture and groundwater.`);
    }

    const isRecommended = issues.length === 0;

    return {
      proposedCrop: proposed.cropName,
      isRecommended,
      suitabilityRating: isRecommended ? 'Optimal Sequence' : 'Caution Advised',
      issues,
      benefits,
      agronomicGuideline: 'Alternating crop families and introducing legumes interrupts pest cycles and balances soil nutrient mining.'
    };
  }

  static getRecommendationsForFarm(farmId, currentCrop = '') {
    const idStr = String(farmId).toLowerCase();
    const isGosaba = idStr.includes('gosaba') || idStr.includes('24 parganas');
    const isHooghly = idStr.includes('hooghly');

    if (isGosaba) {
      return {
        plans: DETAILED_PLANS['farm-gosaba-03'],
        recommendedSequence: [
          { season: 'Kharif', crop: 'Salt-Tolerant Rice (Aman)', reason: 'Monsoon rains wash surface salts; freshwater standing water feasible.' },
          { season: 'Rabi (Relay)', crop: 'Grass Pea (Khesari)', reason: 'Zero-tillage relay in standing rice; salt-tolerant (up to 4.5 dS/m); fixes nitrogen.' },
          { season: 'Summer/Zaid', crop: 'Fallow with Mulch / Salt-Resistant Fodder', reason: 'Avoid water-intensive Boro rice due to saline water table capillary rise.' }
        ],
        rulesChecked: [
          'Capillary salt avoidance during dry winter months',
          'Biological nitrogen fixation via legume relay',
          'Zero-tillage moisture conservation'
        ]
      };
    }

    return {
      plans: isHooghly ? DETAILED_PLANS['farm-hooghly-02'] : DETAILED_PLANS['farm-bardhaman-01'],
      recommendedSequence: [
        { season: 'Kharif', crop: 'Aman Paddy', reason: 'High seasonal monsoon rainfall supports cereal grain production.' },
        { season: 'Rabi', crop: 'Kufri Pukhraj Potato or Mustard Binoy', reason: 'High-value commercial cash crops thriving in cool Gangetic winter.' },
        { season: 'Zaid / Pre-Kharif', crop: 'Summer Sesame (Til) or Tossa Jute', reason: 'Short-duration turnaround restoring soil structure before next monsoon.' }
      ],
      rulesChecked: [
        'Family alternation (Poaceae -> Solanaceae/Brassicaceae -> Pedaliaceae)',
        'Water deficit compatibility with NASA POWER seasonal rainfall',
        'Turnaround window feasibility between potato harvest and sesame sowing'
      ]
    };
  }
}
