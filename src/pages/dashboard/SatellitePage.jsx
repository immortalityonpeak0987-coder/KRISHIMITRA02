import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { satelliteService } from '../../services/satelliteService';
import { riskService } from '../../services/riskService';
import DataSourceCard from '../../components/common/DataSourceCard';
import FarmMap from '../../components/map/FarmMap';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Droplets,
  Layers,
  Sprout,
  Info,
  Radio,
  Calendar,
  Compass,
  Leaf,
  LineChart as LineChartIcon
} from 'lucide-react';

const NDVI_COLOR_SCALE = [
  { val: '-0.23', color: '#C62828' },
  { val: '-0.11', color: '#B07525' },
  { val: '-0.03', color: '#DCC9A3' },
  { val: '0.05', color: '#DCC9A3' },
  { val: '0.18', color: '#A5D6A7' },
  { val: '0.34', color: '#A5D6A7' },
  { val: '0.52', color: '#2E7D32' },
  { val: '0.68', color: '#2E7D32' },
  { val: '0.78', color: '#1B5E20' },
  { val: '0.85', color: '#1B5E20' }
];

export default function SatellitePage() {
  const { activeFarm, farms, switchFarm, t } = useFarm();
  const [satData, setSatData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [selectedPassIndex, setSelectedPassIndex] = useState(5);
  const [showDifferenceMode, setShowDifferenceMode] = useState(false);

  useEffect(() => {
    async function loadSat() {
      if (!activeFarm) return;
      try {
        const [sRes, rRes] = await Promise.all([
          satelliteService.getSatelliteObservations(activeFarm.id),
          riskService.getRiskAssessment(activeFarm.id)
        ]);
        setSatData(sRes.data);
        setRiskData(rRes.data);
        const curveLen = sRes.data?.vegetationNdvi?.temporalCurve?.length || 6;
        setSelectedPassIndex(curveLen - 1);
      } catch (err) {
        console.error('Failed to load satellite data:', err);
      }
    }
    loadSat();
  }, [activeFarm]);

  const temporalCurve = satData?.vegetationNdvi?.temporalCurve || [
    { date: 'Jun 15', ndvi: 0.32, stage: 'Land Preparation' },
    { date: 'Jul 15', ndvi: 0.48, stage: 'Transplanting' },
    { date: 'Aug 15', ndvi: 0.68, stage: 'Active Tillering' },
    { date: 'Sep 15', ndvi: 0.78, stage: 'Peak Canopy' },
    { date: 'Oct 15', ndvi: 0.62, stage: 'Grain Filling' },
    { date: 'Nov 14', ndvi: 0.68, stage: 'Harvest / Rabi Emergence' }
  ];

  const activePass = temporalCurve[selectedPassIndex] || temporalCurve[temporalCurve.length - 1];

  const histogramData = useMemo(() => {
    const centerVal = showDifferenceMode ? 0.14 : Number(activePass?.ndvi || 0.68);
    return [
      { bin: '-0.19', pct: 2, color: '#D97706' },
      { bin: '-0.07', pct: 4, color: '#EAB308' },
      { bin: '0.05', pct: Math.max(4, Math.round((1 - centerVal) * 18)), color: '#A3E635' },
      { bin: '0.21', pct: Math.max(8, Math.round((1 - centerVal) * 28)), color: '#4ADE80' },
      { bin: '0.38', pct: Math.round(centerVal * 32), color: '#22C55E' },
      { bin: '0.52', pct: Math.round(centerVal * 46), color: '#10B981' },
      { bin: '0.68', pct: Math.round(centerVal * 54), color: '#06B6D4' },
      { bin: '0.78', pct: Math.round(centerVal * 26), color: '#3B82F6' },
      { bin: '0.85', pct: Math.round(centerVal * 12), color: '#6366F1' }
    ];
  }, [activePass, showDifferenceMode]);

  const mapStats = useMemo(() => {
    const mean = showDifferenceMode
      ? 0.16
      : Number(activePass?.ndvi || satData?.vegetationNdvi?.currentNdvi || 0.68);
    const min = Math.max(0.08, +(mean - 0.24).toFixed(2));
    const max = Math.min(0.92, +(mean + 0.14).toFixed(2));
    const affectedPct = mean < 0.45 ? 18 : mean < 0.6 ? 9 : 2;
    return { min, mean: mean.toFixed(2), max, affectedPct };
  }, [activePass, satData, showDifferenceMode]);

  if (!activeFarm || !satData) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text)' }}>
        {t('Loading crop health map...', 'ফলের স্বাস্থ্য মানচিত্র লোড করা হচ্ছে...')}
      </div>
    );
  }

  const { gpmRainfall, smapSoilMoisture, vegetationNdvi } = satData;

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.2rem' }}>
            {t('Crop Health Map', 'ফলের স্বাস্থ্য মানচিত্র')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {t('Satellite-based crop greenness, soil moisture, and rainfall context for ', 'উপগ্রভ-ভিত্তিক ফলের সবুজতা, মাটির আর্দ্রতা ও বৃষ্টিপাতের প্রেক্ষাপট — ')}
            <strong style={{ color: 'var(--color-primary)' }}>{activeFarm.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge badge-success">OPEN DATA</span>
          <span className="badge badge-success">REGIONAL GRID</span>
        </div>
      </div>

      {/* Full-Width Interactive GIS Map */}
      <div
        className="card"
        style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--color-border)'
        }}
      >
        {/* Observation date selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem',
            marginBottom: '0.85rem',
            padding: '0.6rem 0.85rem',
            background: 'var(--color-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {t('Observation Date:', 'পর্যবেক্ষণের তারিখ:')}
            </span>
          </div>

          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            {temporalCurve.map((pass, idx) => {
              const isSelected = !showDifferenceMode && selectedPassIndex === idx;
              return (
                <button
                  key={pass.date}
                  type="button"
                  onClick={() => {
                    setShowDifferenceMode(false);
                    setSelectedPassIndex(idx);
                  }}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-primary)' : 'transparent',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    color: isSelected ? '#FFFFFF' : 'var(--color-text-muted)'
                  }}
                >
                  {pass.date} ({pass.ndvi})
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowDifferenceMode(true)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                background: showDifferenceMode ? 'var(--color-success-bg)' : 'transparent',
                border: showDifferenceMode ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                color: showDifferenceMode ? 'var(--color-primary)' : 'var(--color-text-muted)'
              }}
            >
              Δ {t('Seasonal Change', 'মৌসুমীয় পরিবর্তন')}
            </button>
          </div>
        </div>

        {/* Full-Width Interactive GIS Map */}
        <FarmMap
          farms={farms}
          activeFarm={activeFarm}
          onSelectFarm={switchFarm}
          satelliteData={satData}
          riskData={riskData}
          height={510}
        />

        {/* NDVI Color Scale */}
        <div
          style={{
            marginTop: '0.75rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.55rem 0.9rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text)' }}>
            {t('Crop Greenness Scale — Selected Date:', 'ফলের সবুজতা স্কেল — নির্বাচিত তারিখ:')}
            <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
              {showDifferenceMode
                ? t('Seasonal Change View', 'মৌসুমীয় পরিবর্তন দৃশ্য')
                : `${activePass?.date} (${activePass?.stage})`}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '0.35rem',
              width: '100%'
            }}
          >
            {NDVI_COLOR_SCALE.map((item) => (
              <div key={item.val} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '999px',
                    background: item.color,
                    marginBottom: '2px'
                  }}
                />
                <span
                  style={{
                    fontSize: '0.63rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6" style={{ marginTop: '0.9rem' }}>
          {/* Card 1: NDVI Pixel Distribution */}
          <div
            className="card"
            style={{ padding: '0.85rem' }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {t('Crop Pixel Distribution (%)', 'ফলের পিক্সেল বিন্যাস (%)')}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-primary)'
                }}
              >
                {activePass?.stage}
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginBottom: '0.45rem' }}>
              {t('Est. Stress / Affected Area:', 'অনুমানিক চাপ / প্রভাবিত এলাকা:')}{' '}
              <strong style={{ color: 'var(--color-primary)' }}>{mapStats.affectedPct}%</strong>
            </div>
            <div style={{ height: '125px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,132,123,0.12)" />
                  <XAxis dataKey="bin" stroke="rgba(120,132,123,0.5)" fontSize={10} />
                  <YAxis stroke="rgba(120,132,123,0.5)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '11px'
                    }}
                    formatter={(val) => [`${val}% of plot pixels`, 'Coverage']}
                  />
                  <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                    {histogramData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Map Statistics */}
          <div
            className="card"
            style={{
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                className="flex items-center justify-between"
                style={{
                  marginBottom: '0.5rem',
                  paddingBottom: '0.35rem',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--color-text)'
                }}
              >
                <span className="flex items-center gap-1">
                  <Compass size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>{t('Map Statistics', 'মানচিত্র পরিসংখ্যান')}</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                  {activePass?.date}, 2026
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                <div
                  className="flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.3rem' }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>{t('Min. Greenness', 'সর্বনিম্ন সবুজতা')}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{mapStats.min}</strong>
                </div>
                <div
                  className="flex items-center justify-between"
                  style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.3rem' }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>{t('Mean Greenness', 'গড় সবুজতা')}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{mapStats.mean}</strong>
                </div>
                <div
                  className="flex items-center justify-between"
                  style={{ paddingTop: '0.3rem' }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>{t('Max. Greenness', 'সর্বোচ্চ সবুজতা')}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{mapStats.max}</strong>
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '0.6rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.72rem',
                color: 'var(--color-text-muted)'
              }}
            >
              {t('Regional satellite pixel context — not plot-level measurement.', 'অঞ্চলীয় উপগ্রহ পিক্সেল প্রেক্ষাপট — প্লট-স্তরের পরিমাপ নয়।')}
            </div>
          </div>

          {/* Card 3: Weather & Moisture Context */}
          <div className="card" style={{ padding: '0.85rem' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>
                {t('Weather & Moisture Context', 'আবহাওয়া ও আর্দ্রতা প্রেক্ষাপট')}
              </span>
              <Leaf size={16} style={{ color: 'var(--color-primary)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.6rem' }}>
              <div
                style={{
                  padding: '0.7rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {t('Rainfall (30-day)', 'বৃষ্টিপাত (৩০ দিন)')}
                </div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {gpmRainfall?.thirtyDayAccumulation ?? '--'} mm
                </div>
              </div>
              <div
                style={{
                  padding: '0.7rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {t('Soil Moisture', 'মাটির আর্দ্রতা')}
                </div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {smapSoilMoisture?.surfaceMoisture ?? '--'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              {t('Gridded satellite and weather products reflect regional conditions.', 'গ্রিডেড উপগ্রহ ও আবহাওয়া পণ্য আঞ্চলিক পরিস্থিতি প্রতিফলিত করে।')}
            </div>
          </div>
        </div>

        {/* NDVI Temporal Curve */}
        <div
          className="card"
          style={{
            marginTop: '1.5rem',
            padding: '1rem'
          }}
        >
          <div className="card-header">
            <h3 className="card-title">
              <LineChartIcon size={18} style={{ color: 'var(--color-primary)' }} />
              <span>{t('Crop Greenness Over Time', 'সময়ের সাথে ফলের সবুজতা')}</span>
            </h3>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalCurve} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,132,123,0.12)" />
                <XAxis dataKey="date" stroke="rgba(120,132,123,0.5)" fontSize={12} />
                <YAxis stroke="rgba(120,132,123,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ndvi"
                  name={t('Crop greenness', 'ফসলের সবুজতা')}
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--color-primary)', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DataSourceCard
          sourceName="Open Satellite & Weather Sources"
          product="Crop Health & Soil Moisture Data"
          resolution="Regional Grid (30m–9km)"
          observationDate="Current Season"
          coverage={activeFarm.district}
          dataState="SAMPLE DATA"
          caveat="Satellite greenness shows plant vigor, not specific pest or nutrient names. Cloud cover may block optical views during monsoon months."
        />
      </div>
    </div>
  );
}
