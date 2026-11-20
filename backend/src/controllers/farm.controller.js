import { Farm } from '../models/Farm.js';
import { RecoveryRecord } from '../models/RecoveryRecord.js';
import { SoilTest } from '../models/SoilTest.js';
import { runtimeStore, normalizeFarmForFrontend } from '../seed/runtimeStore.js';
import { localFarmStore } from '../utils/localFarmStore.js';
import { successResponse, errorResponse } from '../utils/response.js';
import mongoose from 'mongoose';

export async function getAllFarms(req, res, next) {
  try {
    let farms = [];
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      try {
        const dbFarms = await Farm.find().lean();
        farms = dbFarms.map(normalizeFarmForFrontend);
      } catch {
        farms = [];
      }
    }
    if (farms.length === 0) {
      const localJsonFarms = localFarmStore.loadAllFarmRecords();
      if (localJsonFarms.length > 0) {
        const existingIds = new Set(runtimeStore.farms.map(f => f.id));
        for (const lf of localJsonFarms) {
          if (!existingIds.has(lf.id)) {
            runtimeStore.farms.unshift(lf);
            existingIds.add(lf.id);
          }
        }
      }
      farms = runtimeStore.farms;
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Farms retrieved successfully.',
      data: farms,
      meta: {
        dataState: isDbConnected ? 'LIVE' : 'DEMO',
        count: farms.length
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getFarmById(req, res, next) {
  try {
    const { farmId } = req.params;
    let farm = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const found = mongoose.isValidObjectId(farmId)
          ? await Farm.findById(farmId).lean()
          : await Farm.findOne({ demoId: farmId }).lean();
        if (found) {
          farm = normalizeFarmForFrontend(found);
        }
      } catch {}
    }

    if (!farm) {
      farm = runtimeStore.farms.find(f => f.id === farmId || f.demoId === farmId) || runtimeStore.farms[0];
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Farm retrieved successfully.',
      data: farm
    });
  } catch (err) {
    next(err);
  }
}

export async function createFarm(req, res, next) {
  try {
    const body = req.body || {};
    const name = (body.name || body.farmName || '').trim();
    const district = (body.district || '').trim();
    const areaVal = parseFloat(body.area?.value ?? body.area);
    const lat = parseFloat(body.coordinates?.latitude ?? body.latitude);
    const lng = parseFloat(body.coordinates?.longitude ?? body.longitude);

    if (!name) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Farm name is required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }
    if (!district) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'District in West Bengal is required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }
    if (isNaN(areaVal) || areaVal <= 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Farm area must be a positive number.',
        errorCode: 'VALIDATION_ERROR'
      });
    }
    if (isNaN(lat) || isNaN(lng) || lat < 21.0 || lat > 27.5 || lng < 85.5 || lng > 90.0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Valid geographic coordinates within West Bengal (21°N–27.5°N, 85.5°E–90°E) are required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const customId = `farm-custom-${Date.now()}`;
    const mainCrop = body.mainCrop || body.currentCrop || 'Aman Paddy';
    const rawFarm = {
      id: customId,
      demoId: customId,
      name,
      farmName: name,
      farmerName: (body.farmerName || 'Registered Farmer').trim(),
      state: 'West Bengal',
      district,
      block: (body.block || '').trim(),
      village: (body.village || '').trim(),
      coordinates: { latitude: lat, longitude: lng },
      area: areaVal,
      areaUnit: body.areaUnit || 'Bigha',
      farmType: body.farmType || 'Irrigated Alluvial',
      soilType: body.soilType || (district.includes('24 Parganas') ? 'Saline Coastal Clay' : 'Gangetic Alluvium (Sandy Clay Loam)'),
      mainCrop,
      currentCrop: mainCrop,
      currentRotation: body.currentRotation || [
        { month: 'Jan', crop: 'Potato', stage: 'Vegetative' },
        { month: 'Feb', crop: 'Potato', stage: 'Harvest' },
        { month: 'Mar', crop: 'Sesame', stage: 'Sowing' },
        { month: 'Apr', crop: 'Sesame', stage: 'Flowering' },
        { month: 'May', crop: 'Sesame', stage: 'Harvest' },
        { month: 'Jun', crop: 'Fallow / Prep', stage: 'Land Preparation' },
        { month: 'Jul', crop: mainCrop, stage: 'Transplanting' },
        { month: 'Aug', crop: mainCrop, stage: 'Tillering' },
        { month: 'Sep', crop: mainCrop, stage: 'Flowering' },
        { month: 'Oct', crop: mainCrop, stage: 'Harvest' },
        { month: 'Nov', crop: 'Mustard', stage: 'Sowing' },
        { month: 'Dec', crop: 'Mustard', stage: 'Vegetative' }
      ],
      lastAnalysisDate: new Date().toISOString().split('T')[0],
      status: 'Registered Plot (Live Session)',
      dataOrigin: 'USER_REGISTERED'
    };

    const normalized = normalizeFarmForFrontend(rawFarm);
    runtimeStore.farms = [normalized, ...runtimeStore.farms];
    localFarmStore.saveFarmRecord(normalized);

    if (mongoose.connection.readyState === 1) {
      try {
        await Farm.create({
          demoId: customId,
          farmName: normalized.name,
          farmerName: normalized.farmerName,
          locationName: `${normalized.village ? normalized.village + ', ' : ''}${normalized.district}`,
          district: normalized.district,
          block: normalized.block,
          village: normalized.village,
          coordinates: normalized.coordinates,
          area: { value: normalized.area, unit: normalized.areaUnit },
          farmType: normalized.farmType,
          soilType: normalized.soilType,
          currentCrop: normalized.mainCrop,
          dataOrigin: 'USER_INPUT'
        });
      } catch {}
    }

    return successResponse(res, {
      statusCode: 201,
      message: 'Farm registered successfully.',
      data: normalized
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFarm(req, res, next) {
  try {
    const { farmId } = req.params;
    const updates = req.body || {};
    const idx = runtimeStore.farms.findIndex(f => f.id === farmId || f.demoId === farmId);
    if (idx === -1) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Farm '${farmId}' not found.`,
        errorCode: 'FARM_NOT_FOUND'
      });
    }

    const updated = normalizeFarmForFrontend({
      ...runtimeStore.farms[idx],
      ...updates,
      id: runtimeStore.farms[idx].id
    });
    runtimeStore.farms[idx] = updated;
    localFarmStore.saveFarmRecord(updated);

    return successResponse(res, {
      statusCode: 200,
      message: 'Farm updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteFarm(req, res, next) {
  try {
    const { farmId } = req.params;
    const idx = runtimeStore.farms.findIndex(f => f.id === farmId || f.demoId === farmId);
    if (idx === -1) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Farm '${farmId}' not found.`,
        errorCode: 'FARM_NOT_FOUND'
      });
    }
    runtimeStore.farms.splice(idx, 1);
    localFarmStore.deleteFarmRecord(farmId);
    return successResponse(res, {
      statusCode: 200,
      message: 'Farm removed successfully.',
      data: { farmId, deleted: true }
    });
  } catch (err) {
    next(err);
  }
}

export async function logFieldObservation(req, res, next) {
  try {
    const { farmId } = req.params;
    const {
      title,
      description,
      photoUrl,
      eventType = 'FIELD_EVIDENCE',
      phase = 'CURRENT',
      observationType = 'crop_condition',
      recordedBy = 'Farmer Field Upload (Live Session)'
    } = req.body || {};

    if (!description && !title && !photoUrl) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Observation note, title, or field photograph is required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    let eventDoc = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(farmId)) {
      try {
        eventDoc = await RecoveryRecord.create({
          farm: farmId,
          eventDate: new Date(),
          eventType: 'FIELD_EVIDENCE',
          title: title || 'Farmer Field Observation',
          description: description || 'Field photograph and condition update submitted by farmer.',
          recoveryStatus: 'AFFECTED',
          evidenceReferences: photoUrl ? [{ url: photoUrl }] : []
        });
      } catch {}
    }

    const newEvent = {
      id: eventDoc?._id?.toString() || `evt-${Date.now()}`,
      farmId,
      date: new Date().toISOString().split('T')[0],
      phase: ['BEFORE', 'DURING', 'RECOVERY', 'CURRENT'].includes(phase) ? phase : 'CURRENT',
      type: eventType,
      observationType,
      title: title || 'Farmer Ground-Truth Field Observation',
      description: description || 'Field photograph and crop condition update submitted by farmer.',
      source: recordedBy,
      verified: true,
      photoUrl: photoUrl || null
    };

    const existing = runtimeStore.observationsByFarm[farmId]
      || runtimeStore.observationsByFarm['farm-bardhaman-01']
      || [];
    runtimeStore.observationsByFarm[farmId] = [newEvent, ...existing];

    return successResponse(res, {
      statusCode: 201,
      message: 'Field observation logged successfully.',
      data: newEvent
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFarmChecklist(req, res, next) {
  try {
    const { farmId } = req.params;
    const { taskId, key, status, checklist } = req.body || {};
    const validStatuses = ['Pending', 'In progress', 'Completed'];

    const isGosaba = String(farmId).toLowerCase().includes('gosaba');
    const existingList = runtimeStore.checklistByFarm[farmId]
      || (isGosaba ? runtimeStore.checklistByFarm['farm-gosaba-03'] : runtimeStore.checklistByFarm['farm-bardhaman-01'])
      || [];

    let updatedList = existingList.map(item => ({ ...item }));

    if (Array.isArray(checklist)) {
      updatedList = checklist;
    } else if ((taskId || key) && validStatuses.includes(status)) {
      updatedList = updatedList.map(item =>
        (item.id === taskId || item.key === key) ? { ...item, status } : item
      );
    } else {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Valid taskId/key and status (Pending, In progress, Completed) are required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    runtimeStore.checklistByFarm[farmId] = updatedList;

    return successResponse(res, {
      statusCode: 200,
      message: 'Recovery checklist updated successfully.',
      data: updatedList
    });
  } catch (err) {
    next(err);
  }
}

export async function logFieldVisit(req, res, next) {
  try {
    const { farmId } = req.params;
    const {
      visitorName = 'Field Extension Officer',
      role = 'Field Officer',
      organization = 'District Agro-Advisory Unit',
      cropCondition = '',
      soilMoistureCondition = '',
      followUpAction = ''
    } = req.body || {};

    if (!cropCondition.trim() && !followUpAction.trim()) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Crop condition or follow-up action note is required to record a field visit.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const newVisit = {
      id: `fv-${Date.now()}`,
      farmId,
      visitDate: new Date().toISOString().split('T')[0],
      visitorName: visitorName.trim(),
      role,
      organization: organization.trim(),
      cropCondition: cropCondition.trim(),
      soilMoistureCondition: soilMoistureCondition.trim() || 'Observed during field inspection',
      followUpAction: followUpAction.trim() || 'Continue routine seasonal monitoring',
      verified: true
    };

    const existingVisits = runtimeStore.fieldVisitsByFarm[farmId] || [];
    runtimeStore.fieldVisitsByFarm[farmId] = [newVisit, ...existingVisits];

    // Also append to farm recovery observations timeline
    const existingObs = runtimeStore.observationsByFarm[farmId]
      || runtimeStore.observationsByFarm['farm-bardhaman-01']
      || [];
    runtimeStore.observationsByFarm[farmId] = [
      {
        id: `evt-visit-${Date.now()}`,
        farmId,
        date: newVisit.visitDate,
        phase: 'CURRENT',
        type: 'INSTITUTIONAL_FIELD_VISIT',
        observationType: 'crop_condition',
        title: `${role} Visit: ${newVisit.visitorName}`,
        description: `${newVisit.cropCondition}. Action: ${newVisit.followUpAction}`,
        source: `${newVisit.organization} (${newVisit.role})`,
        verified: true
      },
      ...existingObs
    ];

    return successResponse(res, {
      statusCode: 201,
      message: 'Institutional field visit recorded successfully.',
      data: newVisit
    });
  } catch (err) {
    next(err);
  }
}

export async function submitSoilTest(req, res, next) {
  try {
    const { farmId } = req.params;
    const body = req.body || {};
    const ph = parseFloat(body.ph);
    const ec = parseFloat(body.ec ?? body.ecDsM ?? body.electricalConductivity);
    const isSimulation = Boolean(body.isSimulation);

    if (isNaN(ph) || ph < 3.0 || ph > 10.5) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Valid soil pH between 3.0 and 10.5 is required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }
    if (isNaN(ec) || ec < 0 || ec > 30) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Valid Electrical Conductivity (EC in dS/m) between 0 and 30 is required.',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const salinityClass = ec >= 4.0
      ? `Moderately to Strongly Saline (EC: ${ec} dS/m)`
      : ec >= 2.0
        ? `Slightly Saline (EC: ${ec} dS/m)`
        : `Non-Saline (EC: ${ec} dS/m < 2.0 dS/m)`;

    const soilHealthVerdict = ec >= 4.0
      ? 'High dry-season salinity hazard detected. Avoid summer Boro rice; prioritize salt-tolerant pulses (Khesari/Moong) and paddy straw surface mulching.'
      : ec >= 2.0
        ? 'Mild salinity threshold detected. Monitor root-zone moisture and avoid salt-sensitive tuber varieties.'
        : 'Normal non-saline soil chemistry. Suitable for standard Rabi potato, mustard, and legume rotations.';

    const record = {
      testDate: body.testDate || new Date().toISOString().split('T')[0],
      labName: isSimulation
        ? 'Interactive Sample Soil Test Simulation'
        : (body.labName || 'Krishi Vigyan Kendra (KVK) Soil Lab').trim(),
      testedBy: isSimulation ? 'Sample Simulation (Not a Certified Lab Record)' : 'User Submitted Laboratory Report',
      ph,
      electricalConductivity: ec,
      ecDsM: ec,
      availableNitrogenKgHa: parseFloat(body.nitrogenKgHa) || 220,
      availablePhosphorusKgHa: parseFloat(body.phosphorusKgHa) || 24,
      availablePotassiumKgHa: parseFloat(body.potassiumKgHa) || 200,
      organicCarbonPercent: parseFloat(body.organicCarbonPercent ?? body.organicCarbonPct) || 0.75,
      nitrogenStatus: body.nitrogenStatus || (parseFloat(body.nitrogenKgHa) < 240 ? 'Low' : 'Medium'),
      salinityClass,
      soilHealthVerdict,
      isVerifiedLab: !isSimulation,
      isSimulation,
      dataState: isSimulation ? 'SIMULATION' : 'LIVE'
    };

    runtimeStore.soilTestsByFarm[farmId] = record;

    // Also add an event to the farm recovery timeline if it is a verified lab record
    if (!isSimulation) {
      const existingObs = runtimeStore.observationsByFarm[farmId] || [];
      runtimeStore.observationsByFarm[farmId] = [
        {
          id: `soil-${Date.now()}`,
          farmId,
          date: record.testDate,
          phase: 'RECOVERY',
          type: 'SOIL_TEST',
          observationType: 'soil_condition',
          title: `Lab Soil Test Logged (pH ${ph}, EC ${ec} dS/m)`,
          description: `${record.labName}: ${salinityClass}. ${soilHealthVerdict}`,
          source: record.labName,
          verified: true
        },
        ...existingObs
      ];
    }

    if (!isSimulation && mongoose.connection.readyState === 1 && mongoose.isValidObjectId(farmId)) {
      try {
        await SoilTest.create({
          farm: farmId,
          testDate: new Date(record.testDate),
          laboratoryName: record.labName,
          electricalConductivity: { value: ec, unit: 'dS/m' },
          pH: ph,
          organicCarbonPercent: record.organicCarbonPercent,
          isVerifiedLab: true,
          dataOrigin: 'LAB_VERIFIED'
        });
      } catch {}
    }

    return successResponse(res, {
      statusCode: 201,
      message: isSimulation
        ? 'Sample soil test simulation evaluated.'
        : 'Laboratory soil test recorded and risk profile updated.',
      data: record
    });
  } catch (err) {
    next(err);
  }
}
