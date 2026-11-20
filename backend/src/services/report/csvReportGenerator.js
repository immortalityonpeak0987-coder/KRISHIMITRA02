/**
 * RFC 4180 Compliant CSV Export Generator
 * Includes UTF-8 BOM (\uFEFF) and Formula Injection Protection
 * KRISHI-MITRA — Smart Agriculture & Allied Sector Monitoring System
 */

export class CsvReportGenerator {
  /**
   * Sanitizes cells to neutralize CSV Formula Injection (=, +, -, @)
   */
  static sanitizeCell(val) {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    if (/^[=+\-@]/.test(str)) {
      str = "'" + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }

  static generateCsv(reportData) {
    const headers = ['Category', 'Parameter', 'Observed Value / Assessment', 'Source'];
    const rows = [];

    // Farm Metadata
    rows.push(['Farm Profile', 'Farm Name', reportData.farm?.farmName || '', 'KRISHI-MITRA Farm Registry']);
    rows.push(['Farm Profile', 'Farmer Name', reportData.farm?.farmerName || '', 'KRISHI-MITRA Farm Registry']);
    rows.push(['Farm Profile', 'District', reportData.farm?.district || '', 'KRISHI-MITRA Farm Registry']);
    rows.push(['Farm Profile', 'Area', `${reportData.farm?.area?.value || ''} ${reportData.farm?.area?.unit || ''}`, 'Farmer Provided']);

    // Environmental Metrics
    if (reportData.environment && reportData.environment.metrics) {
      for (const [param, m] of Object.entries(reportData.environment.metrics)) {
        rows.push([
          'Environmental Observations',
          param,
          m.primaryValue !== null ? `${m.primaryValue} ${m.unit || ''}` : 'N/A (Missing)',
          m.sources && m.sources.length ? m.sources.join('; ') : 'Open weather data'
        ]);
      }
    }

    // Risk Indicators
    if (reportData.risks && Array.isArray(reportData.risks.riskFactors)) {
      rows.push(['Risk Intelligence', 'Overall Risk Level', reportData.risks.overallRiskLevel || 'Indeterminate', 'KRISHI-MITRA Risk Screening']);
      for (const f of reportData.risks.riskFactors) {
        rows.push(['Risk Intelligence', f.category, `${f.level}: ${f.indicator}`, f.source || 'Open data sources']);
      }
    }

    // Crop Rotation Sequence
    if (reportData.cropRotation && Array.isArray(reportData.cropRotation.recommendedSequence)) {
      for (const s of reportData.cropRotation.recommendedSequence) {
        rows.push(['Crop Planning', `Recommended: ${s.season}`, `${s.crop} (${s.reason})`, 'West Bengal Crop Planning Calendar']);
      }
    }

    // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + [
      headers.map(this.sanitizeCell).join(','),
      ...rows.map(row => row.map(this.sanitizeCell).join(','))
    ].join('\r\n');

    return Buffer.from(csvContent, 'utf8');
  }
}
