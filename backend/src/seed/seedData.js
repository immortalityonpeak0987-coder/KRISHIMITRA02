/**
 * KRISHI-MITRA Demonstration Seed Data
 * An independent submission for Seva First Innovation Challenge – Eastern Region
 * Pilot Geography: West Bengal, India
 * 
 * DISCLAIMER:
 * All records in this file are demonstration fixtures intended for local development,
 * testing, and UI validation. Every record carries dataOrigin: 'DEMO'.
 * These records DO NOT represent real-time field, laboratory, or certified measurements.
 */

export const DEMO_FARMS_SEED = [
  {
    demoId: 'farm-bardhaman-01',
    farmName: 'Burdwan Alluvial Demo Plot',
    farmerName: 'Subhasish Mondal',
    locationName: 'Memari-I, Purba Bardhaman',
    district: 'Purba Bardhaman',
    block: 'Memari-I',
    village: 'Bagila',
    coordinates: {
      latitude: 23.2324,
      longitude: 87.8615
    },
    area: {
      value: 4.5,
      unit: 'Bigha'
    },
    farmType: 'Irrigated Alluvial',
    soilType: 'Gangetic Alluvium (Sandy Clay Loam)',
    irrigationType: 'TubeWell_Groundwater',
    currentCrop: 'Aman Paddy',
    previousCrops: ['Potato', 'Sesame'],
    notes: 'Intensive agricultural belt with high cropping intensity. Demonstrates alluvial Gangetic farming workflows.',
    dataOrigin: 'DEMO'
  },
  {
    demoId: 'farm-hooghly-02',
    farmName: 'Hooghly Multi-Crop Demo Farm',
    farmerName: 'Pranab Ghosh',
    locationName: 'Singur, Hooghly',
    district: 'Hooghly',
    block: 'Singur',
    village: 'Beraberi',
    coordinates: {
      latitude: 22.8126,
      longitude: 88.2312
    },
    area: {
      value: 3.0,
      unit: 'Bigha'
    },
    farmType: 'Semi-Irrigated Medium Land',
    soilType: 'Clay Loam with High Organic Matter',
    irrigationType: 'Canal',
    currentCrop: 'Jute & Paddy',
    previousCrops: ['Mustard', 'Jute'],
    notes: 'Commercial multi-crop rotation scenario balancing water demand and canopy coverage.',
    dataOrigin: 'DEMO'
  },
  {
    demoId: 'farm-gosaba-03',
    farmName: 'Gosaba Coastal & Delta Demo Farm',
    farmerName: 'Amal Halder',
    locationName: 'Gosaba, South 24 Parganas',
    district: 'South 24 Parganas',
    block: 'Gosaba',
    village: 'Satjelia',
    coordinates: {
      latitude: 22.1648,
      longitude: 88.8062
    },
    area: {
      value: 5.0,
      unit: 'Bigha'
    },
    farmType: 'Coastal Saline Lowland',
    soilType: 'Saline Coastal Clay',
    irrigationType: 'Pond_Rainwater',
    currentCrop: 'Rainfed Aman Paddy',
    previousCrops: ['Grass Pea (Khesari)'],
    notes: 'Coastal delta demonstration profile prone to tidal surge risk and dry-season soil salinity.',
    dataOrigin: 'DEMO'
  }
];

export const DEMO_CROPS_SEED = [
  {
    cropName: 'Aman Paddy',
    scientificName: 'Oryza sativa',
    cropCategory: 'Cereal',
    suitableSeasons: ['Kharif'],
    suitableSoilTypes: ['Alluvial', 'Clay Loam'],
    waterRequirement: 'High',
    source: 'West Bengal Crop Planning Calendar',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    cropName: 'Kufri Pukhraj Potato',
    scientificName: 'Solanum tuberosum',
    cropCategory: 'Tuber',
    suitableSeasons: ['Rabi'],
    suitableSoilTypes: ['Sandy Loam', 'Alluvial Loam'],
    waterRequirement: 'Medium',
    source: 'ICAR-Central Potato Research Institute (CPRI)',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    cropName: 'Tossa Jute',
    scientificName: 'Corchorus olitorius',
    cropCategory: 'Fiber',
    suitableSeasons: ['Pre-Kharif', 'Kharif'],
    suitableSoilTypes: ['Alluvial Loam', 'Clay Loam'],
    waterRequirement: 'Medium',
    source: 'ICAR-Central Research Institute for Jute and Allied Fibres (CRIJAF)',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    cropName: 'Mustard (B-9 / Binoy)',
    scientificName: 'Brassica campestris',
    cropCategory: 'Oilseed',
    suitableSeasons: ['Rabi'],
    suitableSoilTypes: ['Sandy Loam', 'Clay Loam'],
    waterRequirement: 'Low',
    source: 'Regional Oilseed Research Reference',
    dataOrigin: 'RESEARCH_VERIFIED'
  },
  {
    cropName: 'Salt-Tolerant Rice (Gosaba Demo)',
    scientificName: 'Oryza sativa (Coastal Ecotype)',
    cropCategory: 'Cereal',
    suitableSeasons: ['Kharif'],
    suitableSoilTypes: ['Saline Coastal Clay'],
    waterRequirement: 'High',
    source: 'Demonstration cultivar for coastal delta workflows',
    dataOrigin: 'DEMO'
  },
  {
    cropName: 'Grass Pea (Khesari)',
    scientificName: 'Lathyrus sativus',
    cropCategory: 'Pulse',
    suitableSeasons: ['Rabi'],
    suitableSoilTypes: ['Clay', 'Saline Clay'],
    waterRequirement: 'Low',
    source: 'Regional Pulse Research Programme',
    dataOrigin: 'RESEARCH_VERIFIED'
  }
];

export const DEMO_SOIL_TESTS_SEED = [
  {
    farmDemoId: 'farm-gosaba-03',
    testDate: new Date('2026-10-15'),
    laboratoryName: 'Canning Coastal Soil Testing Laboratory (Demonstration Record)',
    laboratoryReference: 'DEMO-SOIL-2026-GOSABA-01',
    electricalConductivity: {
      value: 4.8, // Demonstration baseline; clearly labeled as DEMO
      unit: 'dS/m'
    },
    pH: 7.2,
    organicCarbonPercent: 0.65,
    soilTexture: 'Coastal Silty Clay',
    isVerifiedLab: false, // Mandatory scientific rule: defaults strictly to false
    verificationDetails: 'Fictional demonstration baseline record for UI evaluation.',
    dataOrigin: 'DEMO'
  },
  {
    farmDemoId: 'farm-bardhaman-01',
    testDate: new Date('2026-10-20'),
    laboratoryName: 'Burdwan District Soil Testing Laboratory (Demonstration Record)',
    laboratoryReference: 'DEMO-SOIL-2026-BARD-01',
    electricalConductivity: {
      value: 0.35, // Demonstration baseline; clearly labeled as DEMO
      unit: 'dS/m'
    },
    pH: 6.8,
    organicCarbonPercent: 0.85,
    soilTexture: 'Gangetic Sandy Clay Loam',
    isVerifiedLab: false,
    verificationDetails: 'Fictional demonstration baseline record for UI evaluation.',
    dataOrigin: 'DEMO'
  }
];

export const DEMO_ROTATIONS_SEED = [
  {
    farmDemoId: 'farm-bardhaman-01',
    year: 2026,
    monthlyPlan: [
      { month: 'Jan', cropName: 'Potato', stage: 'Bulb enlargement' },
      { month: 'Feb', cropName: 'Potato', stage: 'Maturity / Harvest' },
      { month: 'Mar', cropName: 'Sesame', stage: 'Sowing / Vegetative' },
      { month: 'Apr', cropName: 'Sesame', stage: 'Flowering' },
      { month: 'May', cropName: 'Sesame', stage: 'Harvesting' },
      { month: 'Jun', cropName: 'Fallow / Prep', stage: 'Land Puddling' },
      { month: 'Jul', cropName: 'Aman Paddy', stage: 'Transplanting' },
      { month: 'Aug', cropName: 'Aman Paddy', stage: 'Tillering' },
      { month: 'Sep', cropName: 'Aman Paddy', stage: 'Panicle Initiation' },
      { month: 'Oct', cropName: 'Aman Paddy', stage: 'Harvesting' },
      { month: 'Nov', cropName: 'Potato', stage: 'Land Prep & Sowing' },
      { month: 'Dec', cropName: 'Potato', stage: 'Vegetative growth' }
    ],
    source: 'Demonstration Rotation Calendar',
    dataOrigin: 'DEMO'
  }
];
