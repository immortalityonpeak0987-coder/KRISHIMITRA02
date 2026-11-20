async function postAiEndpoint(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || (json && json.success === false)) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `Smart AI request failed (HTTP ${response.status}). Please verify your API configuration.`;
    throw new Error(msg);
  }
  return json?.data || json;
}

export function buildFarmContextPayload(activeFarm, extra = {}) {
  if (!activeFarm) return extra;
  return {
    id: activeFarm.id,
    name: activeFarm.name,
    district: activeFarm.district,
    agroClimaticZone: activeFarm.agroClimaticZone,
    area: activeFarm.area,
    areaUnit: activeFarm.areaUnit,
    currentCrop: activeFarm.currentCrop,
    soilType: activeFarm.soilType,
    coordinates: activeFarm.coordinates || {
      latitude: activeFarm.latitude || 23.2324,
      longitude: activeFarm.longitude || 87.8615
    },
    ...extra
  };
}

export const aiService = {
  async generateSmartAdvisory({ farmContext, pageType = 'overview', language = 'en' }) {
    return postAiEndpoint('/api/v1/ai/advisory', { farmContext, pageType, language });
  },

  async diagnoseFieldPhoto({
    farmContext,
    imageBase64,
    mimeType,
    symptomNote,
    conditionPreset,
    language = 'en'
  }) {
    return postAiEndpoint('/api/v1/ai/diagnose', {
      farmContext,
      imageBase64,
      mimeType,
      symptomNote,
      conditionPreset,
      language
    });
  },

  async generateActionPlan({
    farmContext,
    planType = 'crop-planner',
    scenarioParams = {},
    language = 'en'
  }) {
    return postAiEndpoint('/api/v1/ai/plan', {
      farmContext,
      planType,
      scenarioParams,
      language
    });
  },

  async chatWithKisanSahayak({ farmContext, message, history = [], language = 'en' }) {
    return postAiEndpoint('/api/v1/ai/chat', {
      farmContext,
      message,
      history,
      language
    });
  },

  async analyzeSimulation({
    farmContext,
    simulationType = 'climate',
    simulationInputs = {},
    language = 'en'
  }) {
    return postAiEndpoint('/api/v1/ai/simulate', {
      farmContext,
      simulationType,
      simulationInputs,
      language
    });
  },

  async generateCropRotationPlan({ farmContext, language = 'en' }) {
    return postAiEndpoint('/api/v1/ai/rotation', {
      farmContext,
      language
    });
  }
};
