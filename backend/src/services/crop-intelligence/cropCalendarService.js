/**
 * Crop Calendar Service
 * 12-month calendar planning (Jan-Dec) with phenological stages
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import { RESEARCH_VERIFIED_CROPS } from './cropKnowledgeBase.js';

export class CropCalendarService {
  static getAnnualCalendar(cropName) {
    const crop = RESEARCH_VERIFIED_CROPS.find(c => c.cropName.toLowerCase() === String(cropName).toLowerCase()) || RESEARCH_VERIFIED_CROPS[0];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const calendar = months.map(month => {
      let activity = 'Fallow / Soil Maintenance';
      let stage = 'Rest';

      if (crop.sowingWindow && (month === crop.sowingWindow.startMonth || month === crop.sowingWindow.endMonth)) {
        activity = `Sowing / Seedling Prep for ${crop.cropName}`;
        stage = 'Establishment';
      } else if (crop.harvestWindow && (month === crop.harvestWindow.startMonth || month === crop.harvestWindow.endMonth)) {
        activity = `Harvesting & Threshing of ${crop.cropName}`;
        stage = 'Harvest';
      }

      return {
        month,
        crop: crop.cropName,
        stage,
        activity
      };
    });

    return {
      crop: crop.cropName,
      family: crop.family,
      calendar,
      agronomicSource: crop.source
    };
  }
}
