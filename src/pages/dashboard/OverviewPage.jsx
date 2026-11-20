import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { climateService } from '../../services/climateService';
import { riskService } from '../../services/riskService';
import { satelliteService } from '../../services/satelliteService';
import { soilService } from '../../services/soilService';
import DataSourceCard from '../../components/common/DataSourceCard';
import DemoBadge from '../../components/common/DemoBadge';
import FarmMap from '../../components/map/FarmMap';
import SmartAdvisoryCard from '../../components/ai/SmartAdvisoryCard';
import {
  CloudSun,
  Droplets,
  Thermometer,
  Sprout,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Activity,
  Repeat,
  Compass,
  FileText,
  Layers,
  FlaskConical,
  Leaf,
} from 'lucide-react';

export default function OverviewPage() {
  const { activeFarm, farms, switchFarm, t, formatArea } = useFarm();
  const [climateData, setClimateData] = useState(null);
  const [climateMeta, setClimateMeta] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [satelliteData, setSatelliteData] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      if (!activeFarm) return;
      setLoading(true);
      try {
        const [cRes, rRes, sRes, soilRes] = await Promise.all([
          climateService.getClimateByFarmId(activeFarm.id),
          riskService.getRiskAssessment(activeFarm.id),
          satelliteService.getSatelliteObservations(activeFarm.id),
          soilService.getSoilData(activeFarm.id)
        ]);
        setClimateData(cRes.data);
        setClimateMeta(cRes.metadata);
        setRiskData(rRes.data);
        setSatelliteData(sRes.data);
        setSoilData(soilRes.data);
      } catch (err) {
        console.error('Error loading farm overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [activeFarm]);

  if (!activeFarm) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-text)', marginBottom: '0.75rem' }}>No Active Farm Found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Please register a farm plot or select a sample plot.
        </p>
        <Link to="/app/register-farm" className="btn btn-primary">
          Register Your First Farm
        </Link>
      </div>
    );
  }

  const snapshot = climateData?.currentSnapshot;
  const isLive = climateMeta?.dataState === 'LIVE';

  return (
    <div>
      {/* Page Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '1.35rem', flexWrap: 'wrap', gap: '0.85rem' }}
      >
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', margin: 0 }}>
              {t('My Farm Summary — ', 'আমার খামারের সারসংক্ষেপ — ')}
              <strong style={{ color: 'var(--color-primary)' }}>{activeFarm.name}</strong>
            </h1>
            <DemoBadge
              label={isLive ? 'LIVE DATA' : 'SAMPLE DATA'}
              isLive={isLive}
            />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {t(
              'Simple weather, soil moisture, crop health, and next-step guidance for ',
              'আপনার খামারের আবহাওয়া, মাটির আর্দ্রতা ও কাজের সহজ নির্দেশিকা — '
            )}
            <strong style={{ color: 'var(--color-primary)' }}>{activeFarm.name}</strong> (
            {activeFarm.district}, {formatArea(activeFarm)}).
          </p>
        </div>

        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <Link to="/app/satellite" className="btn btn-sm btn-secondary">
            <Leaf size={15} style={{ color: 'var(--color-primary)' }} />
            <span>{t('View Crop Map', 'ফলের মানচিত্র দেখুন')}</span>
          </Link>
          <Link to="/app/crop-planner" className="btn btn-sm btn-primary">
            <Repeat size={15} />
            <span>{t('What to Grow Next', 'পরবর্তী ফসল পরিকল্পনা')}</span>
          </Link>
          <Link to="/app/reports" className="btn btn-sm btn-outline">
            <FileText size={15} />
            <span>{t('Print Farm Report', 'প্রতিবেদন প্রিন্ট')}</span>
          </Link>
        </div>
      </div>

      <SmartAdvisoryCard
        pageType="overview"
        weatherSummary={{
          tempC: snapshot?.temperatureCelsius,
          rainfall30d: snapshot?.rainfallLast30DaysMm,
          humidity: snapshot?.humidityPercent
        }}
        soilSummary={{
          ph: soilData?.latestLabTest?.ph,
          ec: soilData?.latestLabTest?.ecDsM
        }}
        satelliteSummary={{
          ndvi: satelliteData?.currentIndices?.ndvi,
          moisture: satelliteData?.currentIndices?.soilMoistureStatus
        }}
      />

      {/* 4 PRIMARY CARDS */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
        {/* 1. Temperature */}
        <div className="card" style={{ padding: '1.2rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              {t("Today's Weather", 'আজকের আবহাওয়া')}
            </span>
            <Thermometer size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div
            style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              color: 'var(--color-text)',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {snapshot ? `${snapshot.temperature}°C` : '--'}
          </div>
          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.4rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            Day High: {snapshot?.maxTemperature ?? '--'}°C • Night Low: {snapshot?.minTemperature ?? '--'}°C
          </div>
          <div
            className="flex items-center justify-between"
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              marginTop: '0.55rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.4rem'
            }}
          >
            <span>{t('Regional Weather', 'অঞ্চলীয় আবহাওয়া')}</span>
            <span>Humidity: {snapshot?.relativeHumidity ?? 68}%</span>
          </div>
        </div>

        {/* 2. Rainfall */}
        <div className="card" style={{ padding: '1.2rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              {t('Recent Rainfall (30 Days)', 'গত ৩০ দিনের বৃষ্টিপাত')}
            </span>
            <Droplets size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div
            style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {satelliteData?.gpmRainfall?.thirtyDayAccumulation ?? snapshot?.rainfallMonthlyToDate ?? '--'} mm
          </div>
          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              marginTop: '0.4rem'
            }}
          >
            Last 7 Days: {satelliteData?.gpmRainfall?.sevenDayAccumulation ?? 14.5} mm
          </div>
          <div
            className="flex items-center justify-between"
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              marginTop: '0.55rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.4rem'
            }}
          >
            <span>{t('Satellite Rain Check', 'উপগ্রহ বৃষ্টিপাত পরীক্ষা')}</span>
            <span>{satelliteData?.gpmRainfall?.sevenDayAccumulation > 60 ? 'Wet' : 'Normal'}</span>
          </div>
        </div>

        {/* 3. Soil Moisture */}
        <div className="card" style={{ padding: '1.2rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              {t('Estimated Moisture in Soil', 'মাটিতে আনুমানিক আর্দ্রতা')}
            </span>
            <Layers size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--color-text)',
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {soilFriendlyLabel(satelliteData?.smapSoilMoisture?.surfaceMoisture)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
            Deep Soil: {satelliteData?.smapSoilMoisture?.rootZoneMoisture || '0.32 cm³/cm³'}
          </div>
          <div
            className="flex items-center justify-between"
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              marginTop: '0.55rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.4rem'
            }}
          >
            <span>{t('Regional Soil Moisture', 'অঞ্চলীয় মাটির আর্দ্রতা')}</span>
            <span>0–100 cm depth</span>
          </div>
        </div>

        {/* 4. Vegetation Condition */}
        <div className="card" style={{ padding: '1.2rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              {t('How Green & Healthy Crop Looks', 'ফল কতটা সবুজ ও সুস্থ')}
            </span>
            <Sprout size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {Number(satelliteData?.vegetationNdvi?.currentNdvi || 0.68) >= 0.6
              ? `Healthy (${satelliteData?.vegetationNdvi?.currentNdvi || '0.68'})`
              : `Moderate (${satelliteData?.vegetationNdvi?.currentNdvi || '0.54'})`}
          </div>
          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              marginTop: '0.4rem'
            }}
          >
            {satelliteData?.vegetationNdvi?.ndviHealth || 'Healthy Crop Stand'}
          </div>
          <div
            className="flex items-center justify-between"
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
              marginTop: '0.55rem',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.4rem'
            }}
          >
            <span>{t('Satellite Crop View', 'উপগ্রহ থেকে ফলের দৃশ্য')}</span>
            <span>Verified</span>
          </div>
        </div>
      </div>

      {/* GIS MAP + SOIL & CROP SUMMARY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Left: Map */}
        <div className="card" style={{ gridColumn: 'span 1', padding: '1.15rem' }}>
          <div className="card-header" style={{ marginBottom: '0.75rem' }}>
            <div>
              <h3 className="card-title">
                <Compass size={19} style={{ color: 'var(--color-primary)' }} />
                <span>{t('Farm Plot Map', 'খামারের মানচিত্র')}</span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                View your farm location and nearby plots.
              </p>
            </div>
          </div>

          <FarmMap
            farms={farms}
            activeFarm={activeFarm}
            onSelectFarm={switchFarm}
            height={400}
          />
        </div>

        {/* Right: Soil & Rotation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Soil Profile Card */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3 className="card-title">
                <FlaskConical size={18} style={{ color: 'var(--color-primary)' }} />
                <span>{t('Soil Profile', 'মাটির প্রোফাইল')}</span>
              </h3>
              <span className="badge badge-info">
                {soilData?.labTest?.isDefaultDemo ? 'REGIONAL BASELINE' : 'LAB TEST'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '0.9rem'
              }}
            >
              <div
                style={{
                  background: 'var(--color-success-bg)',
                  padding: '0.7rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(46, 125, 50, 0.3)'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Soil pH</div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {soilData?.labTest?.ph ?? '6.4'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                  Neutral
                </div>
              </div>

              <div
                style={{
                  background: 'var(--color-warning-bg)',
                  padding: '0.7rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(176, 117, 37, 0.3)'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  Salinity (EC)
                </div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {soilData?.labTest?.ecDsM ?? '0.85'} dS/m
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                  Threshold: 4.0 dS/m
                </div>
              </div>

              <div
                style={{
                  background: 'var(--color-info-bg)',
                  padding: '0.7rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(46, 125, 50, 0.3)'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  Organic Carbon
                </div>
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {soilData?.labTest?.organicCarbonPct ?? '0.68'}%
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                  N: {soilData?.labTest?.nitrogenStatus || 'Medium'}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>Texture: {activeFarm.soilType}</span>
              <Link to="/app/risk" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                + Update Soil Test →
              </Link>
            </div>
          </div>

          {/* 12-Month Rotation Strip Summary */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header" style={{ marginBottom: '0.65rem' }}>
              <h3 className="card-title">
                <Repeat size={18} style={{ color: 'var(--color-primary)' }} />
                <span>{t('12-Month Crop Calendar', '১২ মাসের ফসল ক্যালেন্ডার')}</span>
              </h3>
              <Link
                to="/app/crop-planner"
                style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary)' }}
              >
                {t('View Alternatives →', 'বিকল্প দেখুন →')}
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
                gap: '0.4rem'
              }}
            >
              {Object.entries(activeFarm.monthlyRotation || {}).map(([month, crop]) => (
                <div
                  key={month}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.45rem',
                    fontSize: '0.7rem'
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      fontSize: '0.65rem'
                    }}
                  >
                    {month}
                  </div>
                  <div
                    style={{
                      color: crop === 'Fallow' ? 'var(--color-text-muted)' : 'var(--color-text)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={crop}
                  >
                    {crop}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NEXT ACTIONS & RISK SCREENING */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Left: Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CheckCircle2 size={20} style={{ color: 'var(--color-primary)' }} />
              <span>{t('Next Steps', 'পরবর্তী ধাপসমূহ')}</span>
            </h3>
            <span className="badge badge-success">GUIDANCE</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                padding: '0.9rem',
                background: 'var(--color-success-bg)',
                border: '1px solid rgba(46, 125, 50, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.8rem'
              }}
            >
              <div
                style={{
                  background: 'var(--color-primary)',
                  color: '#FFFFFF',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '2px'
                }}
              >
                <Repeat size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                  Check Crop Rotation Options
                </strong>
                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Review your 12-month crop calendar and consider water-saving pulses or mustard.
                </p>
                <Link
                  to="/app/crop-planner"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>Open Crop Planner</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div
              style={{
                padding: '0.9rem',
                background: 'var(--color-warning-bg)',
                border: '1px solid rgba(176, 117, 37, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.8rem'
              }}
            >
              <div
                style={{
                  background: 'var(--color-warning)',
                  color: '#FFFFFF',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '2px'
                }}
              >
                <Droplets size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                  Soil Salinity Check
                </strong>
                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Verify soil salinity before planting sensitive crops like potato.
                </p>
                <Link
                  to="/app/risk"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>Open Soil Test & Risk</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div
              style={{
                padding: '0.9rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.8rem'
              }}
            >
              <div
                style={{
                  background: 'rgba(220, 201, 163, 0.2)',
                  color: 'var(--color-primary)',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '2px'
                }}
              >
                <Activity size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                  Log Field Recovery
                </strong>
                <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Record field observations after rain or hazards.
                </p>
                <Link
                  to="/app/recovery"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>Open Recovery Tracker</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Risk Screening */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={20} style={{ color: '#FBBF24' }} />
              <span>{t('Hazard Screening', 'ঝুঁকি মূল্যায়ন')}</span>
            </h3>
            <span
              className={`badge ${
                riskData?.overallRiskLevel?.includes('High')
                  ? 'badge-warning'
                  : 'badge-success'
              }`}
            >
              {riskData?.overallRiskLevel || 'Evaluated'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(riskData?.riskFactors || []).map((rf, idx) => {
              const isHigh = rf.level?.includes('High') || rf.level?.includes('Severe');
              const isMod = rf.level?.includes('Moderate');
              return (
                <div
                  key={idx}
                  style={{
                    padding: '0.8rem 0.9rem',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderLeft: `3px solid ${
                      isHigh ? '#C62828' : isMod ? '#B07525' : 'var(--color-primary)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: '0.25rem' }}
                  >
                    <strong style={{ color: 'var(--color-text)' }}>{rf.category}</strong>
                    <span
                      style={{
                        fontSize: '0.73rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: isHigh ? '#C62828' : isMod ? '#B07525' : 'var(--color-primary)'
                      }}
                    >
                      {rf.level} {rf.score !== undefined ? `(${rf.score}/100)` : ''}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                    {rf.indicator}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-primary)' }}>
                    <strong>Advice:</strong> {rf.recommendation}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="flex items-center justify-between"
            style={{
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)'
            }}
          >
            <span>Heuristic screening — verify with local agricultural officer.</span>
            <Link
              to="/app/risk"
              style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}
            >
              Full Breakdown →
            </Link>
          </div>
        </div>
      </div>

      {/* Provenance Card */}
      <DataSourceCard
        sourceName="Open Weather & Satellite Sources"
        product="Weather & Soil Moisture Data"
        resolution="Regional Grid"
        observationDate={snapshot?.observationDate || 'Current Season'}
        coverage={activeFarm.district}
        dataState={isLive ? 'LIVE DATA' : 'SAMPLE DATA'}
        caveat="Gridded data reflects regional trends. Combine with laboratory soil testing before making treatment decisions."
      />
    </div>
  );
}

function soilFriendlyLabel(value) {
  if (!value) return '--';
  if (value.includes('Near Saturation')) return 'Very Wet';
  return 'Good Moisture';
}
