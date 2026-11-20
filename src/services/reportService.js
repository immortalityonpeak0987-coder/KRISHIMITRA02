// Farm Advisory Report Service
// Compiles farm data, open environmental observations, and recommendations for PDF download, printing, and CSV export

import { apiRequest } from '../api/apiClient';
import { farmService } from './farmService';
import { climateService } from './climateService';
import { riskService } from './riskService';
import { cropService } from './cropService';
import { soilService } from './soilService';

export const reportService = {
  async generateFarmReport(farmId) {
    const [farm, climate, risks, rotation, soil, backendRep] = await Promise.all([
      farmService.getFarmById(farmId),
      climateService.getClimateByFarmId(farmId),
      riskService.getRiskAssessment(farmId),
      cropService.getRotationRecommendations(farmId),
      soilService.getSoilData(farmId),
      apiRequest('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ farmId, reportType: 'FULL_ADVISORY', format: 'PDF' })
      })
    ]);

    const backendReportData = backendRep?.data || null;

    return {
      reportId: backendReportData?.reportId || `KM-REP-${farmId}-${Date.now().toString().slice(-6)}`,
      storageKey: backendReportData?.storageKey || null,
      downloadUrl: backendReportData?.reportId ? `/api/reports/${backendReportData.reportId}/download` : null,
      generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      farm,
      climate: climate.data,
      climateMeta: climate.metadata,
      risks: risks.data,
      riskMeta: risks.metadata,
      rotation: rotation.data,
      soil: soil.data,
      sourceMetadata: {
        sources: 'Open weather and satellite datasets (regional grids), local crop calendars, and farmer-recorded plot details',
        institution: 'KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System',
        officialTagline: 'Simple weather, soil, and crop guidance for Indian farmers.',
        disclaimer: 'This advisory report combines open environmental data with local agro-ecological guidance from the West Bengal Crop Planning Calendar. Gridded satellite and weather estimates reflect regional conditions and do not replace direct laboratory soil NPK/EC testing.'
      }
    };
  },

  exportToCSV(reportData) {
    const headers = ['Category', 'Parameter', 'Observed Value', 'Unit / Scale', 'Data Source & Provenance'];
    const rows = [
      ['Farm Profile', 'Farm Name', reportData.farm?.name || '', 'Plot', 'KRISHI-MITRA Farm Registry'],
      ['Farm Profile', 'District & Block', `${reportData.farm?.block ? reportData.farm.block + ', ' : ''}${reportData.farm?.district || ''}`, 'West Bengal', 'KRISHI-MITRA Farm Registry'],
      ['Farm Profile', 'Coordinates', `${reportData.farm?.coordinates?.latitude ?? ''}°N, ${reportData.farm?.coordinates?.longitude ?? ''}°E`, 'WGS84', 'GPS / GIS Selection'],
      ['Farm Profile', 'Farm Area', `${reportData.farm?.area || ''} ${reportData.farm?.areaUnit || ''} (${reportData.farm?.areaInAcres || ''} Acres)`, 'Land Area', 'Farmer Provided'],
      ['Climate Snapshot', 'Mean Air Temperature (T2M)', `${reportData.climate?.currentSnapshot?.temperature ?? ''}`, '°C (regional grid)', 'Open weather data'],
      ['Climate Snapshot', 'Max / Min Temperature', `${reportData.climate?.currentSnapshot?.maxTemperature ?? ''} / ${reportData.climate?.currentSnapshot?.minTemperature ?? ''}`, '°C', 'Open weather data'],
      ['Climate Snapshot', 'Relative Humidity (RH2M)', `${reportData.climate?.currentSnapshot?.relativeHumidity ?? ''}`, '%', 'Open weather data'],
      ['Climate Snapshot', 'Monthly Rainfall to Date', `${reportData.climate?.currentSnapshot?.rainfallMonthlyToDate ?? ''}`, 'mm', 'Open weather & satellite estimates'],
      ['Soil Chemistry', 'Soil pH', `${reportData.soil?.latestLabTest?.ph ?? ''}`, 'pH H2O', reportData.soil?.latestLabTest?.labName || 'Soil Lab Record'],
      ['Soil Chemistry', 'Electrical Conductivity (EC)', `${reportData.soil?.latestLabTest?.electricalConductivity ?? ''}`, 'dS/m', reportData.soil?.latestLabTest?.labName || 'Soil Lab Record'],
      ['Risk Intelligence', 'Overall Risk Classification', reportData.risks?.overallRiskLevel || '', 'Heuristic Index', 'KRISHI-MITRA Risk Screening'],
      ['Crop Rotation', 'Primary Recommended Sequence', reportData.rotation?.[0]?.sequence || '', '12-Month Cycle', 'West Bengal Crop Planning Calendar']
    ];

    const escapeCsv = (val) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = '\uFEFF' + [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KRISHI-MITRA_Advisory_${reportData.farm?.id || 'plot'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
