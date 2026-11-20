/**
 * Professional Server-Side PDF Report Generator
 * Pure Node.js implementation via pdfkit
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

import PDFDocument from 'pdfkit';
import { REPORT_DISCLAIMER } from './reportConstants.js';

export class PdfReportGenerator {
  static async generatePdf(reportData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // 1. Header & Branding
        doc.fillColor('#2E7D32').fontSize(20).text('KRISHI-MITRA Farm Advisory Report', { align: 'center' });
        doc.fillColor('#78847B').fontSize(11).text('Smart Agriculture & Allied Sector Monitoring System', { align: 'center' });
        doc.moveDown(0.5);

        doc.strokeColor('#A5D6A7').lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.8);

        // 2. Metadata Box
        doc.fillColor('#26332B').fontSize(10);
        doc.text(`Report ID: ${reportData.reportId || 'KM-REP-DEMO'}`, 40, doc.y);
        doc.text(`Generated: ${new Date(reportData.generatedAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
        doc.text(`Farm: ${reportData.farm?.farmName || 'Demo Plot'} (${reportData.farm?.district || 'West Bengal'})`);
        doc.text(`Farmer: ${reportData.farm?.farmerName || 'Registered Farmer'}`);
        doc.text(`Area: ${reportData.farm?.area?.value || ''} ${reportData.farm?.area?.unit || ''}`);
        doc.moveDown(0.8);

        // 3. Section: Agricultural Risk Assessment
        doc.fillColor('#2E7D32').fontSize(14).text('1. Agricultural Risk Intelligence');
        doc.moveDown(0.3);

        const overallRisk = reportData.risks?.overallRiskLevel || 'Indeterminate';
        doc.fillColor('#C62828').fontSize(11).text(`Overall Risk Status: ${overallRisk}`);
        doc.fillColor('#26332B').fontSize(9);

        if (reportData.risks?.riskFactors && Array.isArray(reportData.risks.riskFactors)) {
          for (const f of reportData.risks.riskFactors) {
            doc.text(`• ${f.category} [${f.level}]: ${f.indicator}`, { indent: 10 });
            doc.fillColor('#78847B').text(`  Recommendation: ${f.recommendation}`, { indent: 10 });
            doc.fillColor('#26332B');
            doc.moveDown(0.2);
          }
        } else {
          doc.text('No active risk factors screened.', { indent: 10 });
        }
        doc.moveDown(0.8);

        // 4. Section: Crop Intelligence & Planning
        doc.fillColor('#2E7D32').fontSize(14).text('2. Crop Rotation & Seasonal Planning');
        doc.moveDown(0.3);
        doc.fillColor('#26332B').fontSize(9);

        if (reportData.cropRotation?.recommendedSequence && Array.isArray(reportData.cropRotation.recommendedSequence)) {
          for (const s of reportData.cropRotation.recommendedSequence) {
            doc.text(`• ${s.season}: ${s.crop}`, { indent: 10 });
            doc.fillColor('#78847B').text(`  Agronomic Rationale: ${s.reason}`, { indent: 10 });
            doc.fillColor('#26332B');
            doc.moveDown(0.2);
          }
        }
        doc.moveDown(0.8);

        // 5. Section: Environmental Observations Summary
        doc.fillColor('#2E7D32').fontSize(14).text('3. Weather & Field Observations');
        doc.moveDown(0.3);
        doc.fillColor('#26332B').fontSize(9);

        if (reportData.environment?.metrics) {
          for (const [param, m] of Object.entries(reportData.environment.metrics)) {
            const valStr = m.primaryValue !== null ? `${m.primaryValue} ${m.unit}` : 'Missing/N/A';
            doc.text(`• ${param}: ${valStr} (Source: ${m.sources && m.sources.length ? m.sources.join(', ') : 'Open weather data'})`, { indent: 10 });
          }
        } else {
          doc.text('Environmental observations awaiting ingest synchronization.', { indent: 10 });
        }
        doc.moveDown(1.5);

        // 6. Scientific Disclaimer
        doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fillColor('#78847B').fontSize(7.5).text(REPORT_DISCLAIMER, { align: 'justify' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
