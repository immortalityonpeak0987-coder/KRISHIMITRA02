/**
 * India Meteorological Department (IMD) Data Normalizer
 * 
 * Transforms raw IMD API responses into standardized KRISHI-MITRA environmental observations.
 * 
 * Scientific Integrity Rules:
 * 1. Missing values (-999, -99.9, 'NA', 'N/A', null) MUST normalize to null, never coerced to 0.
 * 2. Zero values (e.g. 0.0 mm rainfall) represent genuine physical measurements and MUST be preserved.
 * 3. All surface/station measurements MUST designate dataOrigin as 'OBSERVED'.
 * 4. Station readings reflect localized instrument enclosures and must not be generalized
 *    across entire agricultural districts without proper provenance.
 */

import {
  IMD_STATUS,
  SCIENTIFIC_DISCLAIMER,
  WEST_BENGAL_IMD_STATIONS
} from './imd.constants.js';

export function isImdMissingValue(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    const trimmed = val.trim().toUpperCase();
    if (trimmed === '' || trimmed === 'NA' || trimmed === 'N/A' || trimmed === 'NULL' || trimmed === 'NAN') {
      return true;
    }
  }
  const num = Number(val);
  if (isNaN(num)) return true;
  if (Math.abs(num - (-999)) < 0.01 || Math.abs(num - (-99.9)) < 0.01 || Math.abs(num - (-99)) < 0.01) {
    return true;
  }
  return false;
}

export function parseImdNumber(val) {
  if (isImdMissingValue(val)) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

export function parseImdDate(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return { isoDate: now.toISOString().split('T')[0], dateObj: now };
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return { isoDate: dateInput.toISOString().split('T')[0], dateObj: dateInput };
  }

  const str = String(dateInput).trim();

  // Handle DD-MM-YYYY format
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const hour = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0;
    const minute = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
    const second = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
    const dateObj = new Date(Date.UTC(year, month, day, hour, minute, second));
    if (!isNaN(dateObj.getTime())) {
      const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { isoDate, dateObj };
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return { isoDate: parsed.toISOString().split('T')[0], dateObj: parsed };
  }

  const fallback = new Date();
  return { isoDate: fallback.toISOString().split('T')[0], dateObj: fallback };
}

export function normalizeCurrentWeather(rawResponse, requestMeta = {}) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    throw new Error('Cannot normalize invalid or non-object IMD Current Weather response.');
  }

  let stationRecords = [];
  if (Array.isArray(rawResponse)) {
    stationRecords = rawResponse;
  } else if (Array.isArray(rawResponse.data)) {
    stationRecords = rawResponse.data;
  } else if (Array.isArray(rawResponse.stations)) {
    stationRecords = rawResponse.stations;
  } else if (rawResponse.station_id || rawResponse.station_name || rawResponse.temp || rawResponse.temperature) {
    stationRecords = [rawResponse];
  }

  const observations = [];
  let availableCount = 0;
  let missingCount = 0;

  for (const record of stationRecords) {
    const stationId = record.station_id || record.stationId || record.station_code || requestMeta.stationId || 'UNKNOWN';
    const stationName = record.station_name || record.stationName || record.Station_Name || WEST_BENGAL_IMD_STATIONS[stationId]?.name || stationId;
    const { isoDate, dateObj } = parseImdDate(record.observation_time || record.dateTime || record.date || requestMeta.date);

    const tempRaw = record.temp ?? record.temperature ?? record.Temperature ?? record.temp_c;
    const rhRaw = record.rh ?? record.relative_humidity ?? record.humidity ?? record.Humidity;
    const windSpeedRaw = record.wind_speed ?? record.windSpeed ?? record.wind_spd ?? record.Wind_Speed;
    const rainfallRaw = record.rainfall ?? record.rain ?? record.rainfall_mm ?? record.Rainfall;
    const mslpRaw = record.mslp ?? record.pressure ?? record.Pressure;
    const windDirRaw = record.wind_direction ?? record.windDir ?? record.Wind_Direction;

    // Temperature observation
    const tempVal = parseImdNumber(tempRaw);
    const tempMissing = tempVal === null;
    if (tempMissing) missingCount++; else availableCount++;
    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'temp',
      parameter: 'SURFACE_TEMPERATURE',
      value: tempVal,
      unit: '°C',
      qualityFlag: tempMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_CURRENT_WX',
      spatialResolution: 'station',
      temporalResolution: 'hourly',
      dataOrigin: 'OBSERVED',
      stationId,
      stationName,
      metadata: {
        stationId,
        stationName,
        mslp_hpa: parseImdNumber(mslpRaw),
        windDirection_deg: parseImdNumber(windDirRaw),
        rawFillValueUsed: tempMissing
      }
    });

    // Relative Humidity observation
    const rhVal = parseImdNumber(rhRaw);
    const rhMissing = rhVal === null;
    if (rhMissing) missingCount++; else availableCount++;
    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'rh',
      parameter: 'RELATIVE_HUMIDITY',
      value: rhVal,
      unit: '%',
      qualityFlag: rhMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_CURRENT_WX',
      spatialResolution: 'station',
      temporalResolution: 'hourly',
      dataOrigin: 'OBSERVED',
      stationId,
      stationName,
      metadata: {
        stationId,
        stationName,
        rawFillValueUsed: rhMissing
      }
    });

    // Wind Speed observation
    const windVal = parseImdNumber(windSpeedRaw);
    const windMissing = windVal === null;
    if (windMissing) missingCount++; else availableCount++;
    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'wind_speed',
      parameter: 'WIND_SPEED',
      value: windVal,
      unit: 'm/s',
      qualityFlag: windMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_CURRENT_WX',
      spatialResolution: 'station',
      temporalResolution: 'hourly',
      dataOrigin: 'OBSERVED',
      stationId,
      stationName,
      metadata: {
        stationId,
        stationName,
        windDirection_deg: parseImdNumber(windDirRaw),
        rawFillValueUsed: windMissing
      }
    });

    // Rainfall Accumulation observation (preserve 0.0 genuine zero)
    const rainVal = parseImdNumber(rainfallRaw);
    const rainMissing = rainVal === null;
    if (rainMissing) missingCount++; else availableCount++;
    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'rainfall',
      parameter: 'RAINFALL_ACCUMULATION',
      value: rainVal,
      unit: 'mm',
      qualityFlag: rainMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_CURRENT_WX',
      spatialResolution: 'station',
      temporalResolution: 'hourly',
      dataOrigin: 'OBSERVED',
      stationId,
      stationName,
      metadata: {
        stationId,
        stationName,
        isZeroRainfall: rainVal === 0,
        rawFillValueUsed: rainMissing
      }
    });
  }

  const total = observations.length;
  let status = IMD_STATUS.SUCCESS;
  if (total === 0 || availableCount === 0) {
    status = IMD_STATUS.NO_DATA_AVAILABLE;
  } else if (missingCount > 0) {
    status = IMD_STATUS.PARTIAL_DATA;
  }

  return {
    status,
    endpoint: '/current_wx',
    disclaimer: SCIENTIFIC_DISCLAIMER,
    meta: {
      source: 'IMD',
      sourceProduct: 'IMD_CURRENT_WX',
      retrievedAt: new Date().toISOString(),
      stationCount: stationRecords.length,
      requestedStation: requestMeta.stationId || null,
      requestedDistrict: requestMeta.district || null
    },
    summary: {
      totalObservations: total,
      availableObservations: availableCount,
      missingObservations: missingCount
    },
    records: stationRecords,
    observations
  };
}

export function normalizeDistrictRainfall(rawResponse, requestMeta = {}) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    throw new Error('Cannot normalize invalid or non-object IMD District Rainfall response.');
  }

  let districtRecords = [];
  if (Array.isArray(rawResponse)) {
    districtRecords = rawResponse;
  } else if (Array.isArray(rawResponse.data)) {
    districtRecords = rawResponse.data;
  } else if (Array.isArray(rawResponse.districts)) {
    districtRecords = rawResponse.districts;
  } else if (rawResponse.district || rawResponse.District || rawResponse.actual) {
    districtRecords = [rawResponse];
  }

  const observations = [];
  let availableCount = 0;
  let missingCount = 0;

  for (const record of districtRecords) {
    const districtName = record.district || record.District || record.district_name || record.District_Name || requestMeta.district || 'UNKNOWN';
    const stateName = record.state || record.State || 'West Bengal';
    const { isoDate, dateObj } = parseImdDate(record.date || record.Date || record.report_date || requestMeta.date);

    const actualRaw = record.actual ?? record.Actual ?? record.actual_rainfall_mm ?? record.actual_mm;
    const normalRaw = record.normal ?? record.Normal ?? record.normal_rainfall_mm ?? record.normal_mm;
    const departureRaw = record.departure ?? record.Departure ?? record.departure_pct ?? record.departure_percentage;
    const category = record.category ?? record.Category ?? 'UNKNOWN';

    const actualVal = parseImdNumber(actualRaw);
    const normalVal = parseImdNumber(normalRaw);
    const departureVal = parseImdNumber(departureRaw);

    const isMissing = actualVal === null;
    if (isMissing) missingCount++; else availableCount++;

    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'actual_rainfall',
      parameter: 'RAINFALL_ACCUMULATION',
      value: actualVal,
      unit: 'mm',
      qualityFlag: isMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_DISTRICT_RAINFALL',
      spatialResolution: 'district',
      temporalResolution: 'daily',
      dataOrigin: 'OBSERVED',
      district: districtName,
      state: stateName,
      metadata: {
        district: districtName,
        state: stateName,
        normal_mm: normalVal,
        departure_percent: departureVal,
        category,
        isZeroRainfall: actualVal === 0,
        rawFillValueUsed: isMissing
      }
    });
  }

  const total = observations.length;
  let status = IMD_STATUS.SUCCESS;
  if (total === 0 || availableCount === 0) {
    status = IMD_STATUS.NO_DATA_AVAILABLE;
  } else if (missingCount > 0) {
    status = IMD_STATUS.PARTIAL_DATA;
  }

  return {
    status,
    endpoint: '/districtrainfall',
    disclaimer: SCIENTIFIC_DISCLAIMER,
    meta: {
      source: 'IMD',
      sourceProduct: 'IMD_DISTRICT_RAINFALL',
      retrievedAt: new Date().toISOString(),
      districtCount: districtRecords.length,
      requestedDistrict: requestMeta.district || null
    },
    summary: {
      totalObservations: total,
      availableObservations: availableCount,
      missingObservations: missingCount
    },
    records: districtRecords,
    observations
  };
}

export function normalizeStateRainfall(rawResponse, requestMeta = {}) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    throw new Error('Cannot normalize invalid or non-object IMD State Rainfall response.');
  }

  let stateRecords = [];
  if (Array.isArray(rawResponse)) {
    stateRecords = rawResponse;
  } else if (Array.isArray(rawResponse.data)) {
    stateRecords = rawResponse.data;
  } else if (Array.isArray(rawResponse.states)) {
    stateRecords = rawResponse.states;
  } else if (rawResponse.state || rawResponse.State || rawResponse.actual) {
    stateRecords = [rawResponse];
  }

  const observations = [];
  let availableCount = 0;
  let missingCount = 0;

  for (const record of stateRecords) {
    const stateName = record.state || record.State || record.state_name || 'West Bengal';
    const { isoDate, dateObj } = parseImdDate(record.date || record.Date || record.report_date || requestMeta.date);

    const actualRaw = record.actual ?? record.Actual ?? record.actual_rainfall_mm ?? record.actual_mm;
    const normalRaw = record.normal ?? record.Normal ?? record.normal_rainfall_mm ?? record.normal_mm;
    const departureRaw = record.departure ?? record.Departure ?? record.departure_pct;
    const category = record.category ?? record.Category ?? 'UNKNOWN';

    const actualVal = parseImdNumber(actualRaw);
    const normalVal = parseImdNumber(normalRaw);
    const departureVal = parseImdNumber(departureRaw);

    const isMissing = actualVal === null;
    if (isMissing) missingCount++; else availableCount++;

    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'state_actual_rainfall',
      parameter: 'RAINFALL_ACCUMULATION',
      value: actualVal,
      unit: 'mm',
      qualityFlag: isMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_STATE_RAINFALL',
      spatialResolution: 'state',
      temporalResolution: 'daily',
      dataOrigin: 'OBSERVED',
      state: stateName,
      metadata: {
        state: stateName,
        normal_mm: normalVal,
        departure_percent: departureVal,
        category,
        reportingDistricts: parseImdNumber(record.reporting_districts ?? record.Reporting_Districts),
        totalDistricts: parseImdNumber(record.total_districts ?? record.Total_Districts),
        isZeroRainfall: actualVal === 0,
        rawFillValueUsed: isMissing
      }
    });
  }

  const total = observations.length;
  let status = IMD_STATUS.SUCCESS;
  if (total === 0 || availableCount === 0) {
    status = IMD_STATUS.NO_DATA_AVAILABLE;
  } else if (missingCount > 0) {
    status = IMD_STATUS.PARTIAL_DATA;
  }

  return {
    status,
    endpoint: '/staterainfall',
    disclaimer: SCIENTIFIC_DISCLAIMER,
    meta: {
      source: 'IMD',
      sourceProduct: 'IMD_STATE_RAINFALL',
      retrievedAt: new Date().toISOString(),
      stateCount: stateRecords.length
    },
    summary: {
      totalObservations: total,
      availableObservations: availableCount,
      missingObservations: missingCount
    },
    records: stateRecords,
    observations
  };
}

export function normalizeAwsData(rawResponse, requestMeta = {}) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    throw new Error('Cannot normalize invalid or non-object IMD AWS response.');
  }

  let awsRecords = [];
  if (Array.isArray(rawResponse)) {
    awsRecords = rawResponse;
  } else if (Array.isArray(rawResponse.data)) {
    awsRecords = rawResponse.data;
  } else if (Array.isArray(rawResponse.stations)) {
    awsRecords = rawResponse.stations;
  } else if (rawResponse.station_id || rawResponse.stationId || rawResponse.temp) {
    awsRecords = [rawResponse];
  }

  const observations = [];
  let availableCount = 0;
  let missingCount = 0;

  for (const record of awsRecords) {
    const stationId = record.station_id || record.stationId || record.aws_id || requestMeta.stationId || 'UNKNOWN';
    const stationName = record.station_name || record.stationName || stationId;
    const { isoDate, dateObj } = parseImdDate(record.timestamp || record.dateTime || record.date);

    const tempVal = parseImdNumber(record.temp ?? record.temperature ?? record.air_temp);
    const rhVal = parseImdNumber(record.rh ?? record.humidity ?? record.relative_humidity);
    const rainVal = parseImdNumber(record.rainfall ?? record.rain ?? record.rain_cumulative ?? record.rainfall_mm);
    const windSpeedVal = parseImdNumber(record.wind_speed ?? record.windSpeed);
    const windDirVal = parseImdNumber(record.wind_direction ?? record.windDir);
    const batteryVolts = parseImdNumber(record.battery ?? record.battery_v);

    // Temperature
    const tempMissing = tempVal === null;
    if (tempMissing) missingCount++; else availableCount++;
    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'temp',
      parameter: 'SURFACE_TEMPERATURE',
      value: tempVal,
      unit: '°C',
      qualityFlag: tempMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_AWS_ARG',
      spatialResolution: 'point',
      temporalResolution: '15-minute',
      dataOrigin: 'OBSERVED',
      stationId,
      stationName,
      metadata: {
        stationId,
        stationName,
        batteryVolts,
        rawFillValueUsed: tempMissing
      }
    });

    // Relative Humidity
    const rhMissing = rhVal === null;
    if (rhMissing) missingCount++; else availableCount++;
    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'rh',
      parameter: 'RELATIVE_HUMIDITY',
      value: rhVal,
      unit: '%',
      qualityFlag: rhMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_AWS_ARG',
      spatialResolution: 'point',
      temporalResolution: '15-minute',
      dataOrigin: 'OBSERVED',
      stationId,
      stationName,
      metadata: {
        stationId,
        stationName,
        batteryVolts,
        rawFillValueUsed: rhMissing
      }
    });

    // Rainfall
    const rainMissing = rainVal === null;
    if (rainMissing) missingCount++; else availableCount++;
    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'rainfall',
      parameter: 'RAINFALL_ACCUMULATION',
      value: rainVal,
      unit: 'mm',
      qualityFlag: rainMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_AWS_ARG',
      spatialResolution: 'point',
      temporalResolution: '15-minute',
      dataOrigin: 'OBSERVED',
      stationId,
      stationName,
      metadata: {
        stationId,
        stationName,
        batteryVolts,
        isZeroRainfall: rainVal === 0,
        rawFillValueUsed: rainMissing
      }
    });

    // Wind Speed
    const windMissing = windSpeedVal === null;
    if (windMissing) missingCount++; else availableCount++;
    observations.push({
      date: isoDate,
      dateObj,
      rawParameter: 'wind_speed',
      parameter: 'WIND_SPEED',
      value: windSpeedVal,
      unit: 'm/s',
      qualityFlag: windMissing ? 'MISSING' : 'NOMINAL',
      sourceName: 'IMD',
      sourceProduct: 'IMD_AWS_ARG',
      spatialResolution: 'point',
      temporalResolution: '15-minute',
      dataOrigin: 'OBSERVED',
      stationId,
      stationName,
      metadata: {
        stationId,
        stationName,
        windDirection_deg: windDirVal,
        batteryVolts,
        rawFillValueUsed: windMissing
      }
    });
  }

  const total = observations.length;
  let status = IMD_STATUS.SUCCESS;
  if (total === 0 || availableCount === 0) {
    status = IMD_STATUS.NO_DATA_AVAILABLE;
  } else if (missingCount > 0) {
    status = IMD_STATUS.PARTIAL_DATA;
  }

  return {
    status,
    endpoint: '/aws_data',
    disclaimer: SCIENTIFIC_DISCLAIMER,
    meta: {
      source: 'IMD',
      sourceProduct: 'IMD_AWS_ARG',
      retrievedAt: new Date().toISOString(),
      stationCount: awsRecords.length,
      requestedStation: requestMeta.stationId || null
    },
    summary: {
      totalObservations: total,
      availableObservations: availableCount,
      missingObservations: missingCount
    },
    records: awsRecords,
    observations
  };
}
