// Farm Management Service
// Handles farm CRUD, new farm registration, rotation updates, and local fallback sync

import { apiRequest } from '../api/apiClient';
import { DEMO_FARMS, WEST_BENGAL_DISTRICTS } from '../data/mockFarms';

const STORAGE_KEY = 'krishi_mitra_registered_farms_v1';

function getStoredFarms() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[FarmService] Error reading localStorage:', e);
  }
  return DEMO_FARMS;
}

export const farmService = {
  async getAllFarms() {
    const liveResponse = await apiRequest('/api/farms');
    if (liveResponse && Array.isArray(liveResponse.data) && liveResponse.data.length > 0) {
      return liveResponse.data;
    }
    return getStoredFarms();
  },

  async getFarmById(farmId) {
    const liveResponse = await apiRequest(`/api/farms/${farmId}`);
    if (liveResponse && liveResponse.data) {
      return liveResponse.data;
    }
    const all = getStoredFarms();
    return all.find(f => f.id === farmId) || all[0];
  },

  async registerFarm(farmData) {
    const liveResponse = await apiRequest('/api/farms', {
      method: 'POST',
      body: JSON.stringify(farmData),
      throwOnError: true
    });

    if (liveResponse && liveResponse.data) {
      const saved = liveResponse.data;
      try {
        const currentFarms = getStoredFarms();
        const updated = [saved, ...currentFarms.filter(f => f.id !== saved.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return saved;
    }

    throw new Error('Backend did not return a valid registered farm record.');
  },

  async updateFarm(farmId, updates) {
    const liveResponse = await apiRequest(`/api/farms/${farmId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      throwOnError: true
    });
    return liveResponse?.data || null;
  },

  async deleteFarm(farmId) {
    const liveResponse = await apiRequest(`/api/farms/${farmId}`, {
      method: 'DELETE',
      throwOnError: true
    });
    return liveResponse?.data || null;
  },

  getDistricts() {
    return WEST_BENGAL_DISTRICTS;
  }
};
