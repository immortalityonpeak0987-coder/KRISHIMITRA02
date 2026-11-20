import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { climateService } from '../../services/climateService';
import DataSourceCard from '../../components/common/DataSourceCard';
import DemoBadge from '../../components/common/DemoBadge';
import SmartAdvisoryCard from '../../components/ai/SmartAdvisoryCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CloudSun, Droplets, Thermometer, Sun, Wind } from 'lucide-react';

const SEASON_FILTERS = [
  { id: 'ALL', label: 'Full Year', months: null },
  { id: 'KHARIF', label: 'Monsoon (Jun–Oct)', months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'] },
  { id: 'RABI', label: 'Winter (Nov–Feb)', months: ['Nov', 'Dec', 'Jan', 'Feb'] },
  { id: 'SUMMER', label: 'Summer (Mar–May)', months: ['Mar', 'Apr', 'May'] }
];

export default function ClimatePage() {
  const { activeFarm, t } = useFarm();
  const [climateState, setClimateState] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState('ALL');

  useEffect(() => {
    async function fetchClimate() {
      if (!activeFarm) return;
      try {
        const res = await climateService.getClimateByFarmId(activeFarm.id);
        setClimateState(res);
      } catch (err) {
        console.error('Failed to load climate data:', err);
      }
    }
    fetchClimate();
  }, [activeFarm]);

  const rawTrends = climateState?.data?.monthlyTrends || [];

  const filteredTrends = useMemo(() => {
    const filterObj = SEASON_FILTERS.find((s) => s.id === selectedSeason);
    if (!filterObj || !filterObj.months) return rawTrends;
    return rawTrends.filter((item) => filterObj.months.includes(item.month));
  }, [rawTrends, selectedSeason]);

  const seasonalMetrics = useMemo(() => {
    if (!filteredTrends.length) {
      return { totalRain: 0, normalRain: 0, avgTemp: 0, maxPeak: 0, avgHumidity: 0 };
    }
    const totalRain = filteredTrends.reduce((acc, m) => acc + (Number(m.rainfall) || 0), 0);
    const normalRain = filteredTrends.reduce((acc, m) => acc + (Number(m.rainfallNormal) || 0), 0);
    const avgTemp =
      filteredTrends.reduce((acc, m) => acc + (Number(m.tempMean) || 0), 0) / filteredTrends.length;
    const maxPeak = Math.max(...filteredTrends.map((m) => Number(m.tempMax) || 0));
    const avgHumidity =
      filteredTrends.reduce((acc, m) => acc + (Number(m.humidity) || 68), 0) / filteredTrends.length;

    return {
      totalRain: Math.round(totalRain),
      normalRain: Math.round(normalRain),
      avgTemp: avgTemp.toFixed(1),
      maxPeak: maxPeak.toFixed(1),
      avgHumidity: Math.round(avgHumidity)
    };
  }, [filteredTrends]);

  if (!activeFarm || !climateState) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text)' }}>
        {t('Loading weather data...', 'আবহাওয়ার তথ্য লোড করা হচ্ছে...')}
      </div>
    );
  }

  const { data, metadata } = climateState;
  const isLive = metadata?.dataState === 'LIVE';

  return (
    <div>
      {/* Header & Season Filter Bar */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '1.35rem', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', margin: 0 }}>
              {t('Weather & Seasonal Insights', 'আবহাওয়া ও মৌসুমীয় অন্তর্দৃষ্টি')}
            </h1>
            <DemoBadge
              label={isLive ? 'LIVE DATA' : 'SAMPLE DATA'}
              isLive={isLive}
            />
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {t('Monthly weather patterns for ', 'মাসিক আবহাওয়ার ধরণ — ')}
            <strong style={{ color: 'var(--color-primary)' }}>{activeFarm.district}</strong>
          </p>
        </div>

        {/* Season Filter Controls */}
        <div
          className="flex items-center gap-1"
          style={{
            background: 'var(--color-surface)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            flexWrap: 'wrap'
          }}
        >
          {SEASON_FILTERS.map((season) => {
            const active = selectedSeason === season.id;
            return (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? '#FFFFFF' : 'var(--color-text-muted)',
                  border: 'none'
                }}
              >
                {season.label}
              </button>
            );
          })}
        </div>
      </div>

      <SmartAdvisoryCard
        pageType="climate"
        weatherSummary={{
          tempC: `${seasonalMetrics.avgTemp}°C`,
          rainfall30d: `${seasonalMetrics.totalRain} mm`,
          humidity: `${seasonalMetrics.avgHumidity}%`
        }}
      />

      {/* 4 SEASONAL SUMMARY METRICS */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
            {t('Rainfall This Season', 'এই মৌসুমের বৃষ্টিপাত')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {seasonalMetrics.totalRain} mm
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Normal: {seasonalMetrics.normalRain} mm
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
            {t('Average Temperature', 'গড় তাপমাত্রা')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--color-text)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {seasonalMetrics.avgTemp}°C
          </div>
          <div style={{ fontSize: '0.74rem', color: '#F97316', marginTop: '0.25rem' }}>
            Peak: {seasonalMetrics.maxPeak}°C
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
            {t('Relative Humidity', 'আপেক্ষিক আর্দ্রতা')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {seasonalMetrics.avgHumidity}%
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {t('Atmospheric moisture', 'বায়ুর আর্দ্রতা')}
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
            {t('Solar Radiation', 'সৌর রশ্মি')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#B07525',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {data?.currentSnapshot?.solarRadiation ?? 18.4} MJ/m²/d
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {t('Sunlight for crops', 'ফলের জন্য সূর্যালোক')}
          </div>
        </div>
      </div>

      {/* Seasonal Advisories */}
      {data?.anomalies && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            background: 'var(--color-success-bg)',
            border: '1px solid rgba(46, 125, 50, 0.3)'
          }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <CloudSun size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--color-text)' }}>
              {t('Seasonal Farming Advisories', 'মৌসুমীয় কৃষি পরামর্শ')}
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              fontSize: '0.84rem'
            }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>{t('Monsoon:', 'বর্ষা:')}</strong>
              <div style={{ color: 'var(--color-text)', marginTop: '0.25rem' }}>
                {data.anomalies.monsoonStatus}
              </div>
            </div>
            <div
              style={{
                background: 'var(--color-surface)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            >
              <strong style={{ color: '#B07525' }}>{t('Heat Stress:', 'তাপ চাপ:')}</strong>
              <div style={{ color: 'var(--color-text)', marginTop: '0.25rem' }}>
                {data.anomalies.heatwaveRisk}
              </div>
            </div>
            <div
              style={{
                background: 'var(--color-surface)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>{t('Sowing Window:', 'বপন সময়:')}</strong>
              <div style={{ color: 'var(--color-text)', marginTop: '0.25rem' }}>
                {data.anomalies.delayedSowingRisk}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Chart 1: Rainfall vs Normal */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Droplets size={18} style={{ color: 'var(--color-primary)' }} />
              <span>{t('Rainfall vs Normal (mm)', 'বৃষ্টিপাত বনাম স্বাভাবিক (মিমি)')}</span>
            </h3>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {t('Compares monthly rainfall against the regional baseline for ', 'মাসিক বৃষ্টিপাত আঞ্চলিক গড়ের সাথে তুলনা করুন — ')}
            <strong style={{ color: 'var(--color-primary)' }}>{activeFarm.district}</strong>.
          </p>

          <div style={{ height: '290px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 132, 123, 0.14)" />
                <XAxis dataKey="month" stroke="rgba(120, 132, 123, 0.5)" fontSize={12} />
                <YAxis stroke="rgba(120, 132, 123, 0.5)" fontSize={12} unit="mm" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted)' }} />
                <Bar
                  dataKey="rainfall"
                  name={t('Observed', 'দৃশ্যমান')}
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="rainfallNormal"
                  name={t('Normal', 'স্বাভাবিক')}
                  fill="#9CA3AF"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Temperature Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Thermometer size={18} style={{ color: '#F97316' }} />
              <span>{t('Temperature Trends (°C)', 'তাপমাত্রার ধরণ (°C)')}</span>
            </h3>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {t('Thermal envelope for crop planning and heat stress awareness.', 'ফসল পরিকল্পনা ও তাপ চাপ সচেতনতার জন্য তাপ সীমা।')}
          </p>

          <div style={{ height: '290px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 132, 123, 0.14)" />
                <XAxis dataKey="month" stroke="rgba(120, 132, 123, 0.5)" fontSize={12} />
                <YAxis stroke="rgba(120, 132, 123, 0.5)" fontSize={12} unit="°C" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-muted)' }} />
                <Line
                  type="monotone"
                  dataKey="tempMax"
                  name={t('Max Temp', 'সর্বোচ্চ তাপমাত্রা')}
                  stroke="#F87171"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="tempMean"
                  name={t('Mean Temp', 'গড় তাপমাত্রা')}
                  stroke="#B07525"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="tempMin"
                  name={t('Min Temp', 'সর্বনিম্ন তাপমাত্রা')}
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Provenance */}
      <DataSourceCard
        sourceName="Open Weather & Climate Sources"
        product="Agroclimatology Data"
        resolution="Regional Grid (~50 km)"
        observationDate="Multi-Year Baseline + Current Season"
        coverage={activeFarm.district}
        dataState={isLive ? 'LIVE DATA' : 'SAMPLE DATA'}
        caveat="Gridded weather data reflects regional patterns and may not capture local micro-climates on a single plot."
      />
    </div>
  );
}
