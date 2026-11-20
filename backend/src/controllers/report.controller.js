import { ReportService } from '../services/report/reportService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function generateReport(req, res, next) {
  try {
    const { farmId, reportType, format } = req.body || {};
    if (!farmId) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'farmId is required for report generation.',
        errorCode: 'INVALID_PARAMETERS'
      });
    }

    const report = await ReportService.generateReport(farmId, { reportType, format });

    return successResponse(res, {
      statusCode: 201,
      message: 'Agricultural advisory report generated successfully.',
      data: report
    });
  } catch (err) {
    next(err);
  }
}

export async function listReports(req, res, next) {
  try {
    const { farmId } = req.query;
    const reports = await ReportService.listReports(farmId);

    return successResponse(res, {
      statusCode: 200,
      message: 'Reports retrieved successfully.',
      data: {
        count: reports.length,
        reports
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const report = await ReportService.getReportMetadata(reportId);
    if (!report) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Report '${reportId}' not found.`,
        errorCode: 'REPORT_NOT_FOUND'
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Report metadata retrieved.',
      data: report
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadReport(req, res, next) {
  try {
    const { reportId } = req.params;
    let storageKey = reportId;

    const meta = await ReportService.getReportMetadata(reportId);
    if (meta && meta.storageKey) {
      storageKey = meta.storageKey;
    }

    try {
      const fileBuffer = await ReportService.getReportFile(storageKey);
      const isPdf = storageKey.endsWith('.pdf');
      const isCsv = storageKey.endsWith('.csv');

      if (isPdf) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${storageKey}"`);
      } else if (isCsv) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${storageKey}"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      return res.send(fileBuffer);
    } catch {
      return errorResponse(res, {
        statusCode: 404,
        message: `Report file '${storageKey}' not found on storage provider.`,
        errorCode: 'FILE_NOT_FOUND'
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function deleteReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const deleted = await ReportService.deleteReport(reportId);
    if (!deleted) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Report '${reportId}' not found or could not be deleted.`,
        errorCode: 'REPORT_NOT_FOUND'
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Report deleted successfully.',
      data: { reportId, deleted: true }
    });
  } catch (err) {
    next(err);
  }
}
