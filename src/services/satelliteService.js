// Open Satellite Earth Observation Service
// Connects open rainfall, soil moisture, and vegetation datasets

import { apiRequest } from '../api/apiClient';
import { MOCK_SATELLITE_DATA } from '../data/mockSatellite';

export const satelliteService = {
  async getSatelliteObservations(farmId) {
    const liveResponse = await apiRequest(`/api/analyses/${farmId}/satellite`);
    if (liveResponse && liveResponse.data) {
      return liveResponse;
    }

    const data = MOCK_SATELLITE_DATA[farmId] || MOCK_SATELLITE_DATA['farm-bardhaman-01'];
    return {
      status: 'success',
      data: data,
      metadata: {
        datasets: ['Satellite rainfall estimate', 'Satellite soil moisture estimate', 'Vegetation greenness index', 'Harmonized land imagery'],
        isDemoData: true,
        dataFreshness: 'Observed within last 12-48 hours',
        disclaimer: 'Satellite indicators offer synoptic regional observations. Ground-truthing through farmer observations remains essential.'
      }
    };
  }
};
