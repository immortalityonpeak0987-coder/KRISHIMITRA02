/**
 * Report Generation Service Orchestrator
 * KRISHI-MITRA - Smart Agriculture & Allied Sector Monitoring System
 */

import mongoose from 'mongoose';
import { Report } from '../../models/Report.js';
import { ReportDataAggregator } from './reportDataAggregator.js';
import { PdfReportGenerator } from './pdfReportGenerator.js';
import { CsvReportGenerator } from './csvReportGenerator.js';
import { StorageService } from './storageService.js';
import { REPORT_FORMATS, REPORT_TYPES } from './reportConstants.js';

export class ReportService {
  static async generateReport(farmId, options = {}) {
    const {
      reportType = REPORT_TYPES.COMPLETE_FARM_ASSESSMENT,
      format = REPORT_FORMATS.PDF
    } = options;

    const reportData = await ReportDataAggregator.compileReportData(farmId, options);
    let buffer = null;
    let mimeType = 'application/json';
    let fileExtension = 'json';

    if (format === REPORT_FORMATS.PDF) {
      buffer = await PdfReportGenerator.generatePdf(reportData);
      mimeType = 'application/pdf';
      fileExtension = 'pdf';
    } else if (format === REPORT_FORMATS.CSV) {
      buffer = CsvReportGenerator.generateCsv(reportData);
      mimeType = 'text/csv';
      fileExtension = 'csv';
    } else {
      buffer = Buffer.from(JSON.stringify(reportData, null, 2), 'utf8');
    }

    const filename = `${reportData.reportId}.${fileExtension}`;
    const saved = await StorageService.saveFile(filename, buffer);

    // Persist Report metadata in MongoDB if connected
    let reportDoc = null;
    if (mongoose.connection.readyState === 1) {
      try {
        reportDoc = await Report.create({
          farm: reportData.farm.id,
          reportType,
          title: `KRISHI-MITRA Advisory Report — ${reportData.farm.farmName}`,
          format,
          storageProvider: saved.provider,
          storageKey: saved.storageKey,
          status: 'GENERATED',
          sourceDataReferences: reportData.sourcesAttribution,
          dataOrigin: 'SYSTEM_GENERATED'
        });
      } catch {
        // Disconnected bypass
      }
    }

    return {
      reportId: reportDoc?._id?.toString() || reportData.reportId,
      title: `KRISHI-MITRA Advisory Report — ${reportData.farm.farmName}`,
      farmId,
      format,
      generatedAt: reportData.generatedAt,
      storageKey: saved.storageKey,
      downloadUrl: `/api/v1/reports/${reportDoc?._id?.toString() || saved.storageKey}/download`,
      reportData
    };
  }

  static async getReportMetadata(reportId) {
    let doc = null;
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(reportId)) {
      try {
        doc = await Report.findById(reportId).lean();
      } catch {
        // Not found
      }
    }
    return doc;
  }

  static async getReportFile(storageKey) {
    return StorageService.getFile(storageKey);
  }

  static async listReports(farmId = null) {
    if (mongoose.connection.readyState !== 1) return [];
    const query = {};
    if (farmId) query.farm = farmId;
    try {
      return await Report.find(query).sort({ generatedAt: -1 }).limit(20).lean();
    } catch {
      return [];
    }
  }

  static async deleteReport(reportId) {
    if (mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(reportId)) return false;
    let doc = null;
    try {
      doc = await Report.findById(reportId);
      if (doc) {
        if (doc.storageKey) {
          await StorageService.deleteFile(doc.storageKey);
        }
        await doc.deleteOne();
        return true;
      }
    } catch {
      // Fallback
    }
    return false;
  }
}
