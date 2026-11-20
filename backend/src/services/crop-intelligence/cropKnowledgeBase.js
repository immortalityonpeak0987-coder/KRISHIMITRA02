/**
 * West Bengal Research-Verified Crop Knowledge Base
 * Sources: West Bengal Regional Agronomic Reference, ICAR, CRIJAF, CPRI
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

export const RESEARCH_VERIFIED_CROPS = [
  {
    id: 'crop-aman-paddy',
    cropName: 'Aman Paddy',
    scientificName: 'Oryza sativa',
    cropCategory: 'Cereal',
    family: 'Poaceae',
    suitableSeasons: ['Kharif'],
    sowingWindow: { startMonth: 'Jun', endMonth: 'Jul' },
    harvestWindow: { startMonth: 'Nov', endMonth: 'Dec' },
    durationDays: 135,
    waterRequirement: 'High',
    waterRequirementMm: '1100-1400',
    suitableSoilTypes: ['Gangetic Alluvium', 'Clay Loam', 'Heavy Alluvial'],
    salinityTolerance: {
      thresholdECe: 3.0,
      rating: 'Moderately Sensitive',
      citation: 'CSSRI & Regional Coastal Agronomy Bulletins'
    },
    temperatureRange: {
      minCelsius: 20,
      optimalCelsius: 28,
      maxCelsius: 38,
      citation: 'West Bengal Seasonal Crop Reference'
    },
    nitrogenFixing: false,
    source: 'West Bengal Crop Planning Reference',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    id: 'crop-kufri-potato',
    cropName: 'Kufri Pukhraj Potato',
    scientificName: 'Solanum tuberosum',
    cropCategory: 'Tuber',
    family: 'Solanaceae',
    suitableSeasons: ['Rabi'],
    sowingWindow: { startMonth: 'Oct', endMonth: 'Nov' },
    harvestWindow: { startMonth: 'Jan', endMonth: 'Feb' },
    durationDays: 75,
    waterRequirement: 'Medium',
    waterRequirementMm: '400-500',
    suitableSoilTypes: ['Sandy Loam', 'Alluvial Loam'],
    salinityTolerance: {
      thresholdECe: 1.7,
      rating: 'Sensitive',
      citation: 'ICAR-CPRI Potato Agronomy'
    },
    temperatureRange: {
      minCelsius: 12,
      optimalCelsius: 20,
      maxCelsius: 30, // Tuberization halts above 30C
      citation: 'ICAR-Central Potato Research Institute (CPRI)'
    },
    nitrogenFixing: false,
    source: 'ICAR-CPRI',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    id: 'crop-tossa-jute',
    cropName: 'Tossa Jute',
    scientificName: 'Corchorus olitorius',
    cropCategory: 'Fiber',
    family: 'Malvaceae',
    suitableSeasons: ['Pre-Kharif', 'Kharif'],
    sowingWindow: { startMonth: 'Mar', endMonth: 'Apr' },
    harvestWindow: { startMonth: 'Jul', endMonth: 'Aug' },
    durationDays: 120,
    waterRequirement: 'Medium',
    waterRequirementMm: '500-700',
    suitableSoilTypes: ['Alluvial Loam', 'Clay Loam'],
    salinityTolerance: {
      thresholdECe: 2.0,
      rating: 'Moderately Sensitive',
      citation: 'ICAR-CRIJAF Research Bulletin'
    },
    temperatureRange: {
      minCelsius: 24,
      optimalCelsius: 32,
      maxCelsius: 40,
      citation: 'ICAR-CRIJAF'
    },
    nitrogenFixing: false,
    source: 'ICAR-CRIJAF',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    id: 'crop-mustard-binoy',
    cropName: 'Mustard (B-9 / Binoy)',
    scientificName: 'Brassica campestris',
    cropCategory: 'Oilseed',
    family: 'Brassicaceae',
    suitableSeasons: ['Rabi'],
    sowingWindow: { startMonth: 'Oct', endMonth: 'Nov' },
    harvestWindow: { startMonth: 'Jan', endMonth: 'Feb' },
    durationDays: 85,
    waterRequirement: 'Low',
    waterRequirementMm: '250-350',
    suitableSoilTypes: ['Sandy Loam', 'Alluvial Clay Loam'],
    salinityTolerance: {
      thresholdECe: 3.5,
      rating: 'Moderately Tolerant',
      citation: 'Regional Oilseed Research Reference'
    },
    temperatureRange: {
      minCelsius: 10,
      optimalCelsius: 22,
      maxCelsius: 32,
      citation: 'Regional Oilseed Agronomy Reference'
    },
    nitrogenFixing: false,
    source: 'West Bengal Oilseed Research Reference',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    id: 'crop-grass-pea',
    cropName: 'Grass Pea (Khesari)',
    scientificName: 'Lathyrus sativus',
    cropCategory: 'Pulse',
    family: 'Fabaceae',
    suitableSeasons: ['Rabi'],
    sowingWindow: { startMonth: 'Oct', endMonth: 'Nov' }, // Relay crop in standing Aman rice
    harvestWindow: { startMonth: 'Feb', endMonth: 'Mar' },
    durationDays: 105,
    waterRequirement: 'Low',
    waterRequirementMm: '150-250',
    suitableSoilTypes: ['Clay', 'Saline Coastal Clay', 'Alluvial Clay'],
    salinityTolerance: {
      thresholdECe: 4.5,
      rating: 'Moderately Tolerant',
      citation: 'CSSRI Canning Regional Station'
    },
    temperatureRange: {
      minCelsius: 10,
      optimalCelsius: 20,
      maxCelsius: 32,
      citation: 'Regional Pulse Research Programme'
    },
    nitrogenFixing: true, // Rhizobium leguminosarum biological nitrogen fixation
    source: 'Regional Pulse Agronomy & CSSRI',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    id: 'crop-sesame',
    cropName: 'Summer Sesame (Til)',
    scientificName: 'Sesamum indicum',
    cropCategory: 'Oilseed',
    family: 'Pedaliaceae',
    suitableSeasons: ['Zaid', 'Pre-Kharif'],
    sowingWindow: { startMonth: 'Feb', endMonth: 'Mar' },
    harvestWindow: { startMonth: 'May', endMonth: 'Jun' },
    durationDays: 80,
    waterRequirement: 'Low',
    waterRequirementMm: '200-300',
    suitableSoilTypes: ['Sandy Loam', 'Gangetic Alluvium'],
    salinityTolerance: {
      thresholdECe: 2.2,
      rating: 'Moderately Sensitive',
      citation: 'Regional Oilseed Bulletins'
    },
    temperatureRange: {
      minCelsius: 20,
      optimalCelsius: 30,
      maxCelsius: 40,
      citation: 'West Bengal Seasonal Crop Calendar'
    },
    nitrogenFixing: false,
    source: 'West Bengal Crop Planning Reference',
    dataOrigin: 'RESEARCH_VERIFIED'
  }
];
