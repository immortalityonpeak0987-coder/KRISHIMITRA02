// Farm Recovery Tracking Service
// Manages chronological field event logs, photo submissions, and recovery status

import { apiRequest } from '../api/apiClient';
import { MOCK_RECOVERY_TIMELINES } from '../data/mockRecovery';

export const recoveryService = {
  async getRecoveryTimeline(farmId) {
    const liveResponse = await apiRequest(`/api/analyses/${farmId}/recovery`);
    if (liveResponse && liveResponse.data) {
      return liveResponse;
    }

    const data = MOCK_RECOVERY_TIMELINES[farmId] || MOCK_RECOVERY_TIMELINES['farm-bardhaman-01'];
    return {
      status: 'success',
      data,
      metadata: {
        dataState: 'DEMO',
        isDemoData: true,
        workflowStage: 'AFTER (Farm Recovery & Next-Crop Planning)'
      }
    };
  },

  async logFieldObservation(farmId, observation) {
    const liveResponse = await apiRequest(`/api/farms/${farmId}/observations`, {
      method: 'POST',
      body: JSON.stringify(observation),
      throwOnError: true
    });

    if (liveResponse && liveResponse.data) {
      return {
        success: true,
        event: liveResponse.data
      };
    }

    throw new Error('Failed to log field observation.');
  },

  async updateChecklist(farmId, payload) {
    const liveResponse = await apiRequest(`/api/farms/${farmId}/checklist`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      throwOnError: true
    });

    if (liveResponse && liveResponse.data) {
      return {
        success: true,
        checklist: liveResponse.data
      };
    }
    throw new Error('Failed to update recovery checklist.');
  },

  async logFieldVisit(farmId, visitPayload) {
    const liveResponse = await apiRequest(`/api/farms/${farmId}/field-visits`, {
      method: 'POST',
      body: JSON.stringify(visitPayload),
      throwOnError: true
    });

    if (liveResponse && liveResponse.data) {
      return {
        success: true,
        visit: liveResponse.data
      };
    }
    throw new Error('Failed to record institutional field visit.');
  }
};
