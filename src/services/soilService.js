// Soil Intelligence & Laboratory Soil Testing Service
// Connects SoilGrids 250m statistical predictions with direct laboratory test entries

import { apiRequest } from '../api/apiClient';
import { MOCK_SOIL_DATA } from '../data/mockSoil';

export const soilService = {
  async getSoilData(farmId) {
    const liveResponse = await apiRequest(`/api/analyses/${farmId}/soil`);
    if (liveResponse && liveResponse.data) {
      return liveResponse;
    }

    const data = MOCK_SOIL_DATA[farmId] || MOCK_SOIL_DATA['farm-bardhaman-01'];
    return {
      status: 'success',
      data,
      metadata: {
        modeledSource: 'ISRIC SoilGrids 2.0 (250m Spatial Resolution)',
        laboratoryStandard: 'Government of West Bengal Soil Testing Laboratories / ICAR-CSSRI',
        dataState: 'DEMO',
        isDemoData: true,
        caveat: 'Satellites do not directly sense chemical NPK. Farmers should conduct laboratory soil testing every 2–3 years.'
      }
    };
  },

  async submitLabTest(farmId, testRecord) {
    const liveResponse = await apiRequest(`/api/farms/${farmId}/soil-tests`, {
      method: 'POST',
      body: JSON.stringify(testRecord),
      throwOnError: true
    });

    if (liveResponse && liveResponse.data) {
      return liveResponse;
    }

    throw new Error('Failed to save laboratory soil test.');
  }
};
