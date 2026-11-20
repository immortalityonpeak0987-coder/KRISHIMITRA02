import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_FORMATS, REPORT_TYPES } from '../src/services/report/reportConstants.js';
import { ReportDataAggregator } from '../src/services/report/reportDataAggregator.js';
import { PdfReportGenerator } from '../src/services/report/pdfReportGenerator.js';
import { CsvReportGenerator } from '../src/services/report/csvReportGenerator.js';
import { StorageService } from '../src/services/report/storageService.js';
import { ReportService } from '../src/services/report/reportService.js';

describe('Module 4: Report Generation Suite', () => {
  test('ReportDataAggregator compiles multi-domain report payload', async () => {
    const data = await ReportDataAggregator.compileReportData('farm-bardhaman-01');
    assert.ok(data.reportId);
    assert.ok(data.farm);
    assert.equal(data.farm.district, 'Purba Bardhaman');
    assert.ok(Array.isArray(data.sourcesAttribution));
    assert.ok(data.sourcesAttribution.length >= 4);
  });

  test('PdfReportGenerator produces valid PDF binary with standard magic bytes', async () => {
    const mockData = await ReportDataAggregator.compileReportData('farm-bardhaman-01');
    const pdfBuffer = await PdfReportGenerator.generatePdf(mockData);

    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 500); // Non-trivial PDF size

    // Magic bytes for valid PDF document: %PDF-
    const headerStr = pdfBuffer.slice(0, 5).toString('utf8');
    assert.equal(headerStr, '%PDF-');
  });

  test('CsvReportGenerator produces RFC 4180 CSV with UTF-8 BOM and formula sanitization', () => {
    const mockData = {
      farm: {
        farmName: '=DANGEROUS_FORMULA()',
        farmerName: '+MALICIOUS_CMD',
        district: 'Hooghly',
        area: { value: 3.0, unit: 'Bigha' }
      },
      environment: {
        metrics: {
          SURFACE_TEMPERATURE: { primaryValue: 26.5, unit: '°C' }
        }
      },
      risks: {
        overallRiskLevel: '@PAYLOAD',
        riskFactors: []
      }
    };

    const csvBuffer = CsvReportGenerator.generateCsv(mockData);
    assert.ok(Buffer.isBuffer(csvBuffer));

    // UTF-8 BOM: 0xEF, 0xBB, 0xBF
    assert.equal(csvBuffer[0], 0xEF);
    assert.equal(csvBuffer[1], 0xBB);
    assert.equal(csvBuffer[2], 0xBF);

    const csvText = csvBuffer.toString('utf8');
    // Formula characters must be neutralized with leading single quote
    assert.ok(csvText.includes("'=DANGEROUS_FORMULA()"));
    assert.ok(csvText.includes("'+MALICIOUS_CMD"));
    assert.ok(csvText.includes("'@PAYLOAD"));
  });

  test('StorageService saves, reads, and deletes local files safely', async () => {
    const testKey = `test-${Date.now()}.txt`;
    const content = Buffer.from('KRISHI-MITRA Test Content', 'utf8');

    const saved = await StorageService.saveFile(testKey, content);
    assert.equal(saved.storageKey, testKey);

    const retrieved = await StorageService.getFile(testKey);
    assert.equal(retrieved.toString('utf8'), 'KRISHI-MITRA Test Content');

    const deleted = await StorageService.deleteFile(testKey);
    assert.equal(deleted, true);
  });

  test('ReportService orchestrates full PDF and CSV report lifecycle', async () => {
    // Generate PDF Report
    const pdfReport = await ReportService.generateReport('farm-bardhaman-01', {
      reportType: REPORT_TYPES.COMPLETE_FARM_ASSESSMENT,
      format: REPORT_FORMATS.PDF
    });
    assert.ok(pdfReport.reportId);
    assert.equal(pdfReport.format, REPORT_FORMATS.PDF);
    assert.ok(pdfReport.downloadUrl.includes('/download'));

    // Retrieve file
    const fileBuf = await ReportService.getReportFile(pdfReport.storageKey);
    assert.ok(Buffer.isBuffer(fileBuf));

    // Cleanup generated test file
    await StorageService.deleteFile(pdfReport.storageKey);
  });
});
