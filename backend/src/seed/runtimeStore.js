/**
 * KRISHI-MITRA Runtime & Demonstration Store
 * Provides unified in-memory state when MongoDB is disconnected, while preserving
 * strict scientific provenance labelling (LIVE vs DEMO vs CACHED).
 */

import { DEMO_FARMS_SEED } from './seedData.js';

// Pre-computed realistic field boundary polygons (GeoJSON-style [lat, lng] rings) around each demo plot
const FARM_BOUNDARIES = {
  'farm-bardhaman-01': [
    [23.2342, 87.8592],
    [23.2346, 87.8638],
    [23.2311, 87.8644],
    [23.2305, 87.8598]
  ],
  'farm-hooghly-02': [
    [22.8141, 88.2294],
    [22.8145, 88.2331],
    [22.8110, 88.2335],
    [22.8108, 88.2298]
  ],
  'farm-gosaba-03': [
    [22.1665, 88.8038],
    [22.1669, 88.8086],
    [22.1631, 88.8091],
    [22.1628, 88.8042]
  ]
};

const DEFAULT_ROTATIONS = {
  'farm-bardhaman-01': [
    { month: 'Jan', crop: 'Potato', stage: 'Bulb enlargement' },
    { month: 'Feb', crop: 'Potato', stage: 'Maturity / Harvest' },
    { month: 'Mar', crop: 'Sesame', stage: 'Sowing / Vegetative' },
    { month: 'Apr', crop: 'Sesame', stage: 'Flowering' },
    { month: 'May', crop: 'Sesame', stage: 'Harvesting' },
    { month: 'Jun', crop: 'Fallow / Prep', stage: 'Land Puddling' },
    { month: 'Jul', crop: 'Aman Paddy', stage: 'Transplanting' },
    { month: 'Aug', crop: 'Aman Paddy', stage: 'Tillering' },
    { month: 'Sep', crop: 'Aman Paddy', stage: 'Panicle Initiation' },
    { month: 'Oct', crop: 'Aman Paddy', stage: 'Harvesting' },
    { month: 'Nov', crop: 'Potato', stage: 'Land Prep & Sowing' },
    { month: 'Dec', crop: 'Potato', stage: 'Vegetative growth' }
  ],
  'farm-hooghly-02': [
    { month: 'Jan', crop: 'Mustard', stage: 'Pod filling' },
    { month: 'Feb', crop: 'Mustard', stage: 'Harvest' },
    { month: 'Mar', crop: 'Jute', stage: 'Sowing & Early growth' },
    { month: 'Apr', crop: 'Jute', stage: 'Active growth' },
    { month: 'May', crop: 'Jute', stage: 'Active growth' },
    { month: 'Jun', crop: 'Jute', stage: 'Harvesting & Retting' },
    { month: 'Jul', crop: 'Aman Paddy', stage: 'Transplanting' },
    { month: 'Aug', crop: 'Aman Paddy', stage: 'Tillering' },
    { month: 'Sep', crop: 'Aman Paddy', stage: 'Flowering' },
    { month: 'Oct', crop: 'Aman Paddy', stage: 'Harvesting' },
    { month: 'Nov', crop: 'Mustard', stage: 'Sowing' },
    { month: 'Dec', crop: 'Mustard', stage: 'Vegetative' }
  ],
  'farm-gosaba-03': [
    { month: 'Jan', crop: 'Fallow (High Salinity)', stage: 'Land Resting' },
    { month: 'Feb', crop: 'Fallow (High Salinity)', stage: 'Land Resting' },
    { month: 'Mar', crop: 'Fallow (High Salinity)', stage: 'Land Resting' },
    { month: 'Apr', crop: 'Fallow (High Salinity)', stage: 'Pre-monsoon prep' },
    { month: 'May', crop: 'Land Preparation', stage: 'Desalinization leaching' },
    { month: 'Jun', crop: 'Salt-Tolerant Paddy', stage: 'Seedbed nursery' },
    { month: 'Jul', crop: 'Salt-Tolerant Paddy', stage: 'Transplanting' },
    { month: 'Aug', crop: 'Salt-Tolerant Paddy', stage: 'Tillering' },
    { month: 'Sep', crop: 'Salt-Tolerant Paddy', stage: 'Flowering' },
    { month: 'Oct', crop: 'Salt-Tolerant Paddy', stage: 'Grain filling' },
    { month: 'Nov', crop: 'Salt-Tolerant Paddy', stage: 'Harvesting' },
    { month: 'Dec', crop: 'Grass Pea (Khesari)', stage: 'Relay cropping / Fallow' }
  ]
};

const AGRO_ZONES = {
  'farm-bardhaman-01': 'Old Alluvial Zone (Gangetic Plain)',
  'farm-hooghly-02': 'New Alluvial Zone (Lower Gangetic)',
  'farm-gosaba-03': 'Coastal Saline Delta (Sundarbans)'
};

function buildBoundaryAround(lat, lng) {
  const dLat = 0.0018;
  const dLng = 0.0022;
  return [
    [Number((lat + dLat).toFixed(5)), Number((lng - dLng).toFixed(5))],
    [Number((lat + dLat).toFixed(5)), Number((lng + dLng).toFixed(5))],
    [Number((lat - dLat).toFixed(5)), Number((lng + dLng).toFixed(5))],
    [Number((lat - dLat).toFixed(5)), Number((lng - dLng).toFixed(5))]
  ];
}

export function normalizeFarmForFrontend(raw) {
  const id = raw.id || raw.demoId || raw._id?.toString();
  const areaVal = typeof raw.area === 'object' ? raw.area.value : Number(raw.area || 3.0);
  const areaUnit = typeof raw.area === 'object' ? raw.area.unit : (raw.areaUnit || 'Bigha');
  const areaInAcres = raw.areaInAcres || Number((areaUnit === 'Bigha' ? areaVal * 0.3306 : areaUnit === 'Hectare' ? areaVal * 2.471 : areaVal).toFixed(2));
  const lat = raw.coordinates?.latitude ?? 23.2324;
  const lng = raw.coordinates?.longitude ?? 87.8615;

  return {
    id,
    _id: id,
    demoId: raw.demoId || id,
    name: raw.name || raw.farmName || 'Registered Plot',
    farmName: raw.farmName || raw.name || 'Registered Plot',
    farmerName: raw.farmerName || 'West Bengal Farmer',
    state: raw.state || 'West Bengal',
    district: raw.district || 'Purba Bardhaman',
    block: raw.block || '',
    village: raw.village || '',
    coordinates: {
      latitude: Number(lat),
      longitude: Number(lng)
    },
    boundaryPolygon: raw.boundaryPolygon || FARM_BOUNDARIES[id] || buildBoundaryAround(Number(lat), Number(lng)),
    area: areaVal,
    areaUnit,
    areaInAcres,
    farmType: raw.farmType || 'Irrigated Alluvial',
    soilType: raw.soilType || 'Gangetic Alluvium (Sandy Clay Loam)',
    irrigationType: raw.irrigationType || 'TubeWell_Groundwater',
    mainCrop: raw.mainCrop || raw.currentCrop || 'Aman Paddy',
    currentCrop: raw.currentCrop || raw.mainCrop || 'Aman Paddy',
    previousCrops: raw.previousCrops || ['Potato', 'Sesame'],
    currentRotation: raw.currentRotation || DEFAULT_ROTATIONS[id] || DEFAULT_ROTATIONS['farm-bardhaman-01'],
    lastAnalysisDate: raw.lastAnalysisDate || '2026-11-14',
    status: raw.status || (raw.dataOrigin === 'USER_REGISTERED' ? 'Registered Plot (Live Session)' : 'Demo Profile Active'),
    agroClimaticZone: raw.agroClimaticZone || AGRO_ZONES[id] || (String(raw.district).includes('24 Parganas') ? 'Coastal Saline Delta (Sundarbans)' : 'Gangetic Alluvial Zone'),
    description: raw.description || raw.notes || 'Monitored agricultural plot in West Bengal.',
    dataOrigin: raw.dataOrigin || 'DEMO',
    dataState: raw.dataOrigin === 'USER_REGISTERED' ? 'LIVE' : 'DEMO'
  };
}

export const runtimeStore = {
  farms: DEMO_FARMS_SEED.map(normalizeFarmForFrontend),
  observationsByFarm: {
    'farm-bardhaman-01': [
      {
        id: 'evt-bard-0',
        date: '2026-07-14',
        phase: 'BEFORE',
        type: 'SATELLITE_OBSERVATION',
        observationType: 'crop_condition',
        title: 'Kharif Aman Paddy Transplanting Verified',
        description: 'Normal monsoon onset (245mm June-July rainfall); puddling and paddy transplanting completed on schedule.',
        source: 'Satellite rainfall estimate + Farmer Log',
        verified: true
      },
      {
        id: 'evt-bard-1',
        date: '2026-10-19',
        phase: 'DURING',
        type: 'WEATHER_SHOCK',
        observationType: 'waterlogging',
        title: 'Late-October Cyclonic Rain Spell (+38mm/48hr)',
        description: 'Standing water accumulated in low-lying subplots during grain maturity; temporary lodging observed on 15% of plot.',
        source: 'Satellite rainfall estimate (0.1°)',
        verified: true
      },
      {
        id: 'evt-bard-2',
        date: '2026-10-26',
        phase: 'RECOVERY',
        type: 'FARMER_MITIGATION',
        observationType: 'drainage',
        title: 'Perimeter Drainage Furrows Cleared & Paddy Harvested',
        description: 'Surface water drained into canal within 48 hours; Kharif rice harvested cleanly with 15cm straw stubble retained.',
        source: 'Farmer Field Log',
        verified: true
      },
      {
        id: 'evt-bard-3',
        date: '2026-11-10',
        phase: 'RECOVERY',
        type: 'SOIL_TEST',
        observationType: 'soil_condition',
        title: 'District Laboratory Soil Screening',
        description: 'Soil pH 6.5 and EC 0.35 dS/m verified non-saline. Low nitrogen flagged; legume inclusion recommended.',
        source: 'Burdwan District Soil Testing Lab',
        verified: true
      },
      {
        id: 'evt-bard-4',
        date: '2026-11-14',
        phase: 'CURRENT',
        type: 'SOWING_DECISION',
        observationType: 'replanting',
        title: 'Rabi Sowing Window Active (Potato / Mustard)',
        description: 'Root-zone moisture stabilized at 0.32 cm³/cm³; early tuber and oilseed emergence monitored.',
        source: 'KRISHI-MITRA Decision Support',
        verified: true
      }
    ],
    'farm-hooghly-02': [
      {
        id: 'evt-hoog-0',
        date: '2026-08-12',
        phase: 'BEFORE',
        type: 'SATELLITE_OBSERVATION',
        observationType: 'crop_condition',
        title: 'Jute Retting Complete & Aman Paddy Established',
        description: 'Healthy crop transition from pre-Kharif Tossa Jute to main Kharif rice.',
        source: 'Farmer Field Log',
        verified: true
      },
      {
        id: 'evt-hoog-1',
        date: '2026-10-28',
        phase: 'RECOVERY',
        type: 'HARVEST_EVENT',
        observationType: 'harvest_status',
        title: 'Aman Paddy Harvest & Field Clearing',
        description: 'Medium land plots cleared following timely monsoon withdrawal.',
        source: 'Farmer Field Log',
        verified: true
      },
      {
        id: 'evt-hoog-2',
        date: '2026-11-08',
        phase: 'CURRENT',
        type: 'SOWING_DECISION',
        observationType: 'replanting',
        title: 'Zero-Tillage Mustard (Binoy) Sowing',
        description: 'Sown utilizing residual post-monsoon soil moisture, saving two pre-sowing irrigations.',
        source: 'Hooghly KVK Advisory',
        verified: true
      }
    ],
    'farm-gosaba-03': [
      {
        id: 'evt-gos-0',
        date: '2026-08-05',
        phase: 'BEFORE',
        type: 'CROP_ESTABLISHMENT',
        observationType: 'crop_condition',
        title: 'Salt-Tolerant Aman Paddy (Gosaba-1) Established',
        description: 'Peak monsoon freshwater flush lowered surface salinity, enabling healthy tillering.',
        source: 'CSSRI Canning Benchmark + GPM',
        verified: true
      },
      {
        id: 'evt-gos-1',
        date: '2026-10-18',
        phase: 'DURING',
        type: 'HAZARD_ALERT',
        observationType: 'waterlogging',
        title: 'Tidal Creek High-Water & Subsoil Wetness',
        description: 'GPM IMERG 30-day rainfall (142.5mm) combined with high spring tides slowed lowland drainage.',
        source: 'Satellite rainfall estimate + Field Alert',
        verified: true
      },
      {
        id: 'evt-gos-2',
        date: '2026-10-28',
        phase: 'RECOVERY',
        type: 'SOIL_TEST',
        observationType: 'soil_condition',
        title: 'Coastal Salinity Screening (EC: 4.8 dS/m)',
        description: 'Elevated dry-season electrical conductivity detected. Boro rice contraindicated due to capillary salt rise.',
        source: 'CSSRI Canning Coastal Lab (Demo Record)',
        verified: true
      },
      {
        id: 'evt-gos-3',
        date: '2026-11-12',
        phase: 'CURRENT',
        type: 'RECOVERY_PROTOCOL',
        observationType: 'replanting',
        title: 'Relay Grass Pea (Khesari) Broadcast & Mulching',
        description: 'Zero-tillage relay legume broadcast into standing rice stubble to suppress surface evaporation and salt crusting.',
        source: 'KRISHI-MITRA Coastal Recovery Plan',
        verified: true
      }
    ]
  },
  checklistByFarm: {
    'farm-bardhaman-01': [
      {
        id: 'chk-1',
        key: 'grainMoistureChecked',
        title: 'Dry harvested grain below 14% moisture before storage',
        desc: 'Sun-dry harvested Aman paddy grain below 14% moisture to prevent fungal spoilage and storage loss.',
        status: 'Completed'
      },
      {
        id: 'chk-2',
        key: 'drainageFurrowsCleaned',
        title: 'Clear perimeter drainage channels',
        desc: 'Open field drainage channels so excess surface water drains before winter potato or mustard sowing.',
        status: 'Completed'
      },
      {
        id: 'chk-3',
        key: 'mulchApplied',
        title: 'Keep paddy straw mulch on soil surface (15–20 cm)',
        desc: 'Retain crop residue mulch to conserve soil moisture and reduce irrigation need.',
        status: 'In progress'
      },
      {
        id: 'chk-4',
        key: 'postHarvestStoragePrepared',
        title: 'Prepare certified winter pulse or mustard seed',
        desc: 'Collect certified Mustard (B-9), Lentil, or Green Gram seed from local block seed store.',
        status: 'Pending'
      }
    ],
    'farm-gosaba-03': [
      {
        id: 'chk-g1',
        key: 'grainMoistureChecked',
        title: 'Inspect embankment bund for brackish seepage',
        desc: 'Check outer sluice and field bunds after high tide to prevent saline water entry.',
        status: 'Completed'
      },
      {
        id: 'chk-g2',
        key: 'drainageFurrowsCleaned',
        title: 'Avoid deep winter ploughing on saline clay',
        desc: 'Zero-tillage relay sowing prevents underground salt from rising to the root zone.',
        status: 'Completed'
      },
      {
        id: 'chk-g3',
        key: 'mulchApplied',
        title: 'Spread paddy straw mulch across exposed soil',
        desc: 'Cover soil surface with straw right after harvest to reduce evaporation and salt crusting.',
        status: 'In progress'
      },
      {
        id: 'chk-g4',
        key: 'postHarvestStoragePrepared',
        title: 'Broadcast salt-tolerant Khesari / Pulse relay seed',
        desc: 'Use residual moisture from monsoon rice to establish nitrogen-fixing winter pulses.',
        status: 'Completed'
      }
    ]
  },
  fieldVisitsByFarm: {
    'farm-bardhaman-01': [
      {
        id: 'fv-1',
        farmId: 'farm-bardhaman-01',
        visitDate: '2026-11-11',
        visitorName: 'Rituparna Sen',
        role: 'Field Officer',
        organization: 'Bardhaman Agro-Producer FPO',
        cropCondition: 'Good — Paddy harvested cleanly; ridge preparation underway',
        soilMoistureCondition: 'Adequate residual moisture for Rabi sowing',
        followUpAction: 'Verify certified Kufri Pukhraj seed treatment before Nov 20 planting.',
        verified: true
      }
    ],
    'farm-gosaba-03': [
      {
        id: 'fv-2',
        farmId: 'farm-gosaba-03',
        visitDate: '2026-11-09',
        visitorName: 'Dr. S. Chatterjee',
        role: 'NGO Extension Coordinator',
        organization: 'Sundarbans Climate Resilience Collective',
        cropCondition: 'Moderate — Patchy salinity stress near eastern bund; Khesari emerging',
        soilMoistureCondition: 'Wet clay subsoil; requires surface straw mulch cover',
        followUpAction: 'Conduct follow-up portable EC meter check in mid-December.',
        verified: true
      }
    ]
  },
  soilTestsByFarm: {
    'farm-bardhaman-01': {
      testDate: '2026-09-20',
      labName: 'District Soil Testing Laboratory, Burdwan',
      testedBy: 'Department of Agriculture, Govt. of West Bengal',
      ph: 6.5,
      electricalConductivity: 0.35,
      availableNitrogenKgHa: 215,
      availablePhosphorusKgHa: 24.5,
      availablePotassiumKgHa: 198,
      organicCarbonPercent: 0.74,
      salinityClass: 'Non-Saline (EC < 2.0 dS/m)',
      soilHealthVerdict: 'Good physical structure, but nitrogen depleted due to continuous intensive cropping. Requires pulse/legume inclusion.',
      isVerifiedLab: false,
      dataState: 'DEMO'
    },
    'farm-hooghly-02': {
      testDate: '2026-08-15',
      labName: 'Hooghly Krishi Vigyan Kendra (KVK)',
      testedBy: 'Regional Agronomic Soil Testing Facility, West Bengal',
      ph: 6.7,
      electricalConductivity: 0.42,
      availableNitrogenKgHa: 240,
      availablePhosphorusKgHa: 32.0,
      availablePotassiumKgHa: 220,
      organicCarbonPercent: 0.88,
      salinityClass: 'Non-Saline (EC < 2.0 dS/m)',
      soilHealthVerdict: 'Balanced nutrient index with healthy organic carbon. Crop diversification with Jute provides good root aeration.',
      isVerifiedLab: false,
      dataState: 'DEMO'
    },
    'farm-gosaba-03': {
      testDate: '2026-10-28',
      labName: 'Sundarbans Coastal Soil Testing Facility, Canning',
      testedBy: 'Central Soil Salinity Research Institute (CSSRI)',
      ph: 7.8,
      electricalConductivity: 4.8,
      availableNitrogenKgHa: 180,
      availablePhosphorusKgHa: 14.0,
      availablePotassiumKgHa: 340,
      organicCarbonPercent: 0.52,
      salinityClass: 'Moderately Saline (EC: 4.0 – 8.0 dS/m)',
      soilHealthVerdict: 'High dry-season salinity hazard. Capillary rise of salt expected between January and May. Conventional vegetables/Boro rice will face osmotic failure unless salt-tolerant pulses or mulch conservation is applied.',
      isVerifiedLab: false,
      dataState: 'DEMO'
    }
  }
};
