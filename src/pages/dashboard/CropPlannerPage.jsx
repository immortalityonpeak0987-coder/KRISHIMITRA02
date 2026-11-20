import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { cropService } from '../../services/cropService';
import { aiService, buildFarmContextPayload } from '../../services/aiService';
import DataSourceCard from '../../components/common/DataSourceCard';
import ActionPlanCard from '../../components/ai/ActionPlanCard';
import {
  Repeat,
  Sliders,
  Calendar,
  CheckCircle2,
  Sun,
  Sparkles,
  RefreshCw,
  MapPin
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CropPlannerPage() {
  const { activeFarm, updateActiveFarmRotation, language, t } = useFarm();
  const [recommendations, setRecommendations] = useState([]);
  const [currentRotation, setCurrentRotation] = useState([]);
  const [appliedPlanId, setAppliedPlanId] = useState(null);

  // Smart Crop Rotation Advisor state
  const [smartRotationPlan, setSmartRotationPlan] = useState(null);
  const [smartRotationLoading, setSmartRotationLoading] = useState(false);
  const [smartRotationError, setSmartRotationError] = useState('');

  // Simulator inputs stored as strings so the user can clear them completely without forcing 0
  const [delayDaysInput, setDelayDaysInput] = useState('');
  const [tempOffsetInput, setTempOffsetInput] = useState('');
  const [rainOffsetInput, setRainOffsetInput] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);
  const [smartSimReport, setSmartSimReport] = useState(null);
  const [smartSimLoading, setSmartSimLoading] = useState(false);
  const [smartSimError, setSmartSimError] = useState('');
  const [showSimulation, setShowSimulation] = useState(true);

  useEffect(() => {
    if (!activeFarm) return;

    const initialRot = MONTHS.map((m, idx) => {
      if (Array.isArray(activeFarm.currentRotation) && activeFarm.currentRotation[idx]) {
        return { ...activeFarm.currentRotation[idx], month: m };
      }
      const cropFromMap = activeFarm.monthlyRotation?.[m] || 'Fallow';
      return {
        month: m,
        crop: cropFromMap,
        stage: cropFromMap === 'Fallow' ? 'Resting' : 'Active Stand'
      };
    });
    setCurrentRotation(initialRot);

    async function fetchRecs() {
      const res = await cropService.getRotationRecommendations(activeFarm.id, initialRot);
      setRecommendations(res.data || []);
    }
    fetchRecs();
    setSmartRotationPlan(null);
    setSmartSimReport(null);
  }, [activeFarm]);

  const handleGenerateSmartRotation = async () => {
    if (!activeFarm) return;
    setSmartRotationLoading(true);
    setSmartRotationError('');
    try {
      const farmContext = buildFarmContextPayload(activeFarm);
      const res = await aiService.generateCropRotationPlan({
        farmContext,
        language: language || 'en'
      });
      setSmartRotationPlan(res);
    } catch (err) {
      setSmartRotationError(err.message || 'Could not generate smart crop rotation plan.');
    } finally {
      setSmartRotationLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!activeFarm) return;
    const delay = delayDaysInput.trim() === '' ? 0 : Number(delayDaysInput);
    const temp = tempOffsetInput.trim() === '' ? 0 : parseFloat(tempOffsetInput);
    const rain = rainOffsetInput.trim() === '' ? 0 : Number(rainOffsetInput);

    if (Number.isNaN(delay) || Number.isNaN(temp) || Number.isNaN(rain)) {
      setSmartSimError('Please enter valid numbers for the simulation inputs.');
      return;
    }

    setSmartSimError('');
    setSmartSimLoading(true);

    try {
      const res = await cropService.simulateClimateScenario({
        farmId: activeFarm.id,
        sowingDelayDays: delay,
        tempOffsetCelsius: temp,
        rainfallOffsetPercent: rain
      });
      setSimulationResult(res);

      const farmContext = buildFarmContextPayload(activeFarm);
      const aiReport = await aiService.analyzeSimulation({
        farmContext,
        simulationType: 'What-If Sowing Delay & Weather Scenario',
        simulationInputs: {
          sowingDelayDays: delayDaysInput.trim() === '' ? '0 (On-time sowing)' : `${delay} days`,
          tempOffsetCelsius: tempOffsetInput.trim() === '' ? '0°C (Normal)' : `${temp}°C`,
          rainfallOffsetPercent: rainOffsetInput.trim() === '' ? '0% (Normal)' : `${rain}%`
        },
        language: language || 'en'
      });
      setSmartSimReport(aiReport);
    } catch (err) {
      setSmartSimError(err.message || 'Could not generate smart simulation report.');
    } finally {
      setSmartSimLoading(false);
    }
  };

  const handleRotationChange = async (monthIndex, newCrop) => {
    const normalized = MONTHS.map((m, idx) => {
      const existing = currentRotation[idx];
      return existing ? { ...existing } : { month: m, crop: 'Fallow', stage: 'Resting' };
    });
    normalized[monthIndex] = {
      ...normalized[monthIndex],
      month: MONTHS[monthIndex],
      crop: newCrop,
      stage: newCrop === 'Fallow' ? 'Resting' : 'Scheduled'
    };
    setCurrentRotation(normalized);
    if (updateActiveFarmRotation) {
      updateActiveFarmRotation(normalized);
    }
    const res = await cropService.getRotationRecommendations(activeFarm.id, normalized);
    setRecommendations(res.data || []);
  };

  const handleApplyPlanToCalendar = (plan) => {
    const seqText = plan.sequence || '';
    const isCoastalPlan = seqText.includes('Khesari') || seqText.includes('Luna');
    const isMustardPlan = seqText.includes('Mustard');
    const isLentilPlan = seqText.includes('Lentil');
    const isSesamePlan = seqText.includes('Sesame');

    const newRot = MONTHS.map((m) => {
      if (['Jul', 'Aug', 'Sep', 'Oct'].includes(m)) {
        return { month: m, crop: 'Aman Paddy', stage: 'Kharif Stand' };
      }
      if (['Nov', 'Dec', 'Jan', 'Feb'].includes(m)) {
        const rabiCrop = isCoastalPlan
          ? 'Khesari'
          : isLentilPlan
          ? 'Lentil'
          : isMustardPlan
          ? 'Mustard'
          : 'Potato';
        return { month: m, crop: rabiCrop, stage: 'Rabi Window' };
      }
      if (['Mar', 'Apr', 'May'].includes(m)) {
        const summerCrop = isSesamePlan ? 'Sesame' : 'Moong';
        return { month: m, crop: summerCrop, stage: 'Summer N-Fixation' };
      }
      return { month: m, crop: 'Fallow', stage: 'Pre-Monsoon Rest' };
    });

    setCurrentRotation(newRot);
    if (updateActiveFarmRotation) {
      updateActiveFarmRotation(newRot);
    }
    setAppliedPlanId(plan.id);
    setTimeout(() => setAppliedPlanId(null), 4000);
  };

  if (!activeFarm) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text)' }}>
        {t('Loading crop rotation planner...', 'ফসল পরিকল্পক লোড করা হচ্ছে...', 'फसल रोटेशन प्लानर लोड हो रहा है...')}
      </div>
    );
  }

  const cropColors = {
    Paddy: { bg: 'rgba(46, 125, 50, 0.12)', border: 'var(--color-primary)', color: 'var(--color-primary)' },
    Potato: { bg: 'rgba(176, 117, 37, 0.12)', border: '#B07525', color: '#B07525' },
    Mustard: { bg: 'rgba(220, 201, 163, 0.12)', border: '#DCC9A3', color: '#B07525' },
    Sesame: { bg: 'rgba(220, 201, 163, 0.12)', border: '#DCC9A3', color: '#B07525' },
    Moong: { bg: 'rgba(46, 125, 50, 0.12)', border: 'var(--color-primary)', color: 'var(--color-primary)' },
    Lentil: { bg: 'rgba(46, 125, 50, 0.12)', border: 'var(--color-primary)', color: 'var(--color-primary)' },
    Khesari: { bg: 'rgba(46, 125, 50, 0.12)', border: 'var(--color-primary)', color: 'var(--color-primary)' },
    Jute: { bg: 'rgba(46, 125, 50, 0.12)', border: 'var(--color-primary)', color: 'var(--color-primary)' },
    Fallow: { bg: 'transparent', border: 'var(--color-border)', color: 'var(--color-text-muted)' }
  };

  const parsedDelay = delayDaysInput.trim() === '' ? 0 : Number(delayDaysInput) || 0;
  const parsedTemp = tempOffsetInput.trim() === '' ? 0 : parseFloat(tempOffsetInput) || 0;
  const parsedRain = rainOffsetInput.trim() === '' ? 0 : Number(rainOffsetInput) || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.35rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          {t('Crop Planner & 12-Month Calendar', 'ফসল পরিকল্পনা ও ১২ মাসের ক্যালেন্ডার', 'फसल योजना और 12-महीने का कैलेंडर')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
          {t(
            'Plan your 12-month cropping calendar with weather and soil context for ',
            'আবহাওয়া ও মাটির প্রেক্ষাপটে আপনার ১২ মাসের ফসল ক্যালেন্ডার পরিকল্পনা করুন — ',
            'मौसम और मिट्टी के अनुसार अपना 12-महीने का फसल कैलेंडर बनाएं — '
          )}
          <strong style={{ color: 'var(--color-primary)' }}>{activeFarm.name}</strong>.
        </p>
      </div>

      <ActionPlanCard
        planType="crop-planner"
        scenarioParams={{
          sowingDelayDays: parsedDelay,
          tempOffsetCelsius: parsedTemp,
          rainfallOffsetPercent: parsedRain
        }}
      />

      {/* 1. 12-Month Calendar */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
            <span>{t('12-Month Cropping Calendar', '১২ মাসের ফসল ক্যালেন্ডার', '12-महीने का फसल कैलेंडर')}</span>
          </h3>
          <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
            {t('Click any month to adjust crop', 'যেকোনো মাসে ক্লিক করে ফসল পরিবর্তন করুন', 'फसल बदलने के लिए किसी भी महीने पर क्लिक करें')}
          </span>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1.15rem' }}>
          {t(
            'Select the standing crop for each month (Jan–Dec). Changes update your farm profile immediately.',
            'প্রতি মাসের জন্য (জান–ডিসেম্বর) দাঁড়ানো ফসল বেছে নিন। পরিবর্তনগুলি তাত্ক্ষণিকভাবে আপনার খামার প্রোফাইল আপডেট করে।',
            'प्रत्येक महीने (जनवरी–दिसंबर) के लिए खड़ी फसल चुनें। बदलाव तुरंत आपकी खेत प्रोफ़ाइल में अपडेट हो जाते हैं।'
          )}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
            gap: '0.6rem',
            paddingBottom: '0.5rem'
          }}
        >
          {MONTHS.map((m, idx) => {
            const currentItem = currentRotation[idx] || { month: m, crop: 'Fallow' };
            const cropName = currentItem.crop || 'Fallow';
            const styleKey = Object.keys(cropColors).find((k) => cropName.includes(k)) || 'Fallow';
            const c = cropColors[styleKey];

            return (
              <div
                key={m}
                style={{
                  background: c.bg,
                  border: `1.5px solid ${c.border}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 0.45rem',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: c.color,
                    marginBottom: '0.35rem'
                  }}
                >
                  {m}
                </div>
                <select
                  aria-label={`Select crop for ${m}`}
                  value={cropName}
                  onChange={(e) => handleRotationChange(idx, e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '0.73rem',
                    padding: '0.28rem 0.2rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Aman Paddy">Aman Paddy</option>
                  <option value="Boro Paddy">Boro Paddy</option>
                  <option value="Potato">Potato</option>
                  <option value="Mustard">Mustard</option>
                  <option value="Moong">Moong</option>
                  <option value="Sesame">Sesame</option>
                  <option value="Jute">Jute</option>
                  <option value="Khesari">Khesari</option>
                  <option value="Lentil">Lentil</option>
                  <option value="Fallow">Fallow / Rest</option>
                </select>
                <div
                  style={{
                    fontSize: '0.66rem',
                    color: 'var(--color-text-muted)',
                    marginTop: '0.35rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {currentItem.stage || 'Standing'}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center gap-4"
          style={{
            marginTop: '0.9rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            flexWrap: 'wrap'
          }}
        >
          <span className="flex items-center gap-1">
            <span style={{ width: 10, height: 10, background: 'var(--color-primary)', borderRadius: 2 }} /> {t('Cereals', 'ধান', 'अनाज')}
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: 10, height: 10, background: '#B07525', borderRadius: 2 }} /> {t('Tubers', 'কন্দ', 'कंद')}
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: 10, height: 10, background: '#DCC9A3', borderRadius: 2 }} /> {t('Oilseeds', 'তিলহান', 'तिलहन')}
          </span>
          <span className="flex items-center gap-1">
            <span style={{ width: 10, height: 10, background: 'var(--color-primary)', borderRadius: 2 }} /> {t('Legumes', 'ডাল', 'दालें')}
          </span>
        </div>
      </div>

      {/* 2. Crop Rotation Plans (Smart Location-Based Rotation Advisor + Existing 2 Recommended Plans) */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}
        >
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-text)', marginBottom: '0.2rem' }}>
              {t('Recommended Crop Rotation Plans', 'প্রস্তাবিত ফসল আবর্তন পরিকল্পনা', 'अनुशंसित फसल चक्र योजनाएं')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem', margin: 0 }}>
              {t(
                'Generate a custom Kisan Sahayak location-specific crop rotation plan alongside the 2 standard regional plans.',
                '২টি আঞ্চলিক পরিকল্পনার পাশাপাশি কিষাণ সহায়ক অবস্থান-ভিত্তিক ফসল আবর্তন পরিকল্পনা তৈরি করুন।',
                '2 क्षेत्रीय योजनाओं के साथ अपने खेत के स्थान के आधार पर स्मार्ट फसल चक्र योजना बनाएं।'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGenerateSmartRotation}
              disabled={smartRotationLoading}
              className="btn btn-sm btn-primary"
            >
              {smartRotationLoading ? <RefreshCw size={14} /> : <Sparkles size={14} />}
              <span>
                {smartRotationLoading
                  ? t('Planning Rotation...', 'পরিকল্পনা তৈরি হচ্ছে...', 'योजना बन रही है...')
                  : t('Smart Crop Rotation Advisor', 'স্মার্ট ফসল আবর্তন উপদেষ্টা', 'स्मार्ट फसल चक्र सलाहकार')}
              </span>
            </button>
            <span className="badge badge-success">
              {recommendations.length + (smartRotationPlan ? 1 : 0)} {t('FEASIBLE CYCLES', 'সুবিধাজনক চক্র', 'उपयुक्त चक्र')}
            </span>
          </div>
        </div>

        {smartRotationError && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--color-danger-bg)',
              color: '#C62828',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem'
            }}
          >
            {smartRotationError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Smart Location-Specific Crop Rotation Advisor Card */}
          {smartRotationPlan && (
            <div
              className="card"
              style={{
                borderLeft: '4px solid var(--color-primary)',
                background: 'var(--color-surface)'
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.65rem' }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      letterSpacing: '0.06em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Sparkles size={13} />
                    SMART AI LOCATION-SPECIFIC ROTATION • {activeFarm.district.toUpperCase()} ({Number(activeFarm.coordinates?.latitude || activeFarm.latitude || 23.2324).toFixed(2)}°N, {Number(activeFarm.coordinates?.longitude || activeFarm.longitude || 87.8615).toFixed(2)}°E)
                  </span>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text)', marginTop: '0.15rem', marginBottom: 0 }}>
                    {smartRotationPlan.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                  <div
                    style={{
                      padding: '0.38rem 0.8rem',
                      background: 'var(--color-success-bg)',
                      border: '1px solid rgba(46, 125, 50, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {smartRotationPlan.sequence}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPlanToCalendar(smartRotationPlan)}
                    className="btn btn-xs btn-primary"
                  >
                    <CheckCircle2 size={13} />
                    <span>
                      {appliedPlanId === smartRotationPlan.id
                        ? t('Applied to Calendar!', 'ক্যালেন্ডারে প্রয়োগ করা!', 'कैलेंडर में लागू!')
                        : t('Apply to Calendar', 'ক্যালেন্ডারে প্রয়োগ করুন', 'कैलेंडर में लागू करें')}
                    </span>
                  </button>
                </div>
              </div>

              {smartRotationPlan.locationRationale && (
                <div
                  style={{
                    marginBottom: '0.9rem',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--color-success-bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(46, 125, 50, 0.25)',
                    fontSize: '0.83rem',
                    color: 'var(--color-text)'
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)' }}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    {t('Why this fits your plot location:', 'কেন এটি আপনার জমির অবস্থানের জন্য উপযুক্ত:', 'यह आपके खेत के स्थान के लिए क्यों उपयुक्त है:')}{' '}
                  </strong>
                  {smartRotationPlan.locationRationale}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.6rem',
                  marginBottom: '1.1rem'
                }}
              >
                {(smartRotationPlan.timing || []).map((tItem, tIdx) => (
                  <div
                    key={tIdx}
                    style={{
                      padding: '0.65rem 0.8rem',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-primary)',
                        fontWeight: 700
                      }}
                    >
                      {tItem.window} ({tItem.duration})
                    </div>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-text)', display: 'block', marginTop: '2px' }}>
                      {tItem.crop}
                    </strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {tItem.type}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '0.9rem'
                }}
              >
                <div
                  style={{
                    padding: '0.8rem',
                    background: 'var(--color-success-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(46, 125, 50, 0.3)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text)'
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>
                    {t('Water Saving', 'জল সাশ্রয়', 'जल की बचत')}
                  </strong>
                  {smartRotationPlan.waterSavings}
                </div>
                <div
                  style={{
                    padding: '0.8rem',
                    background: 'var(--color-success-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(46, 125, 50, 0.3)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text)'
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>
                    {t('Soil Nitrogen', 'মাটির নাইট্রোজেন', 'मिट्टी नाइट्रोजन')}
                  </strong>
                  {smartRotationPlan.nitrogenContribution}
                </div>
                <div
                  style={{
                    padding: '0.8rem',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text)'
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>
                    {t('Pest Cycle Break', 'পোকা-চক্র ভঙ্গ', 'कीट-चक्र नियंत्रण')}
                  </strong>
                  {smartRotationPlan.pestCycleBreak}
                </div>
              </div>
            </div>
          )}

          {/* Existing 2 Recommended Plans */}
          {recommendations.map((plan, idx) => (
            <div
              key={plan.id || idx}
              className="card"
              style={{
                borderLeft: `4px solid ${idx === 0 ? 'var(--color-primary)' : 'rgba(120, 132, 123, 0.5)'}`
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.65rem' }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      letterSpacing: '0.06em'
                    }}
                  >
                    OPTION 0{idx + 1} • {idx === 0 ? t('PRIMARY RECOMMENDED', 'প্রাথমিক সুপারিশকৃত', 'प्राथमिक अनुशंसित') : t('ALTERNATIVE STRATEGY', 'বিকল্প কৌশল', 'वैकल्पिक रणनीति')}
                  </span>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text)', marginTop: '0.15rem', marginBottom: 0 }}>
                    {plan.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                  <div
                    style={{
                      padding: '0.38rem 0.8rem',
                      background: 'var(--color-success-bg)',
                      border: '1px solid rgba(46, 125, 50, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {plan.sequence}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPlanToCalendar(plan)}
                    className="btn btn-xs btn-primary"
                  >
                    <CheckCircle2 size={13} />
                    <span>
                      {appliedPlanId === plan.id ? t('Applied to Calendar!', 'ক্যালেন্ডারে প্রয়োগ করা!', 'कैलेंडर में लागू!') : t('Apply to Calendar', 'ক্যালেন্ডারে প্রয়োগ করুন', 'कैलेंडर में लागू करें')}
                    </span>
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.6rem',
                  marginBottom: '1.1rem'
                }}
              >
                {(plan.timing || []).map((tItem, tIdx) => (
                  <div
                    key={tIdx}
                    style={{
                      padding: '0.65rem 0.8rem',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-primary)',
                        fontWeight: 700
                      }}
                    >
                      {tItem.window} ({tItem.duration})
                    </div>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--color-text)', display: 'block', marginTop: '2px' }}>
                      {tItem.crop}
                    </strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {tItem.type}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '0.9rem',
                  marginBottom: '0.9rem'
                }}
              >
                <div
                  style={{
                    padding: '0.8rem',
                    background: 'var(--color-success-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(46, 125, 50, 0.3)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text)'
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>
                    {t('Water Saving', 'জল সাশ্রয়', 'जल की बचत')}
                  </strong>
                  {plan.waterBalance?.estimatedSavings || t('Reduced irrigation demand', 'সেচের চাহিদা হ্রাস', 'सिंचाई की मांग में कमी')}
                </div>
                <div
                  style={{
                    padding: '0.8rem',
                    background: 'var(--color-success-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(46, 125, 50, 0.3)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text)'
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>
                    {t('Soil Nitrogen', 'মাটির নাইট্রোজেন', 'मिट्टी नाइट्रोजन')}
                  </strong>
                  {plan.soilBenefit?.nitrogenContribution || t('Legume rotation adds nitrogen', 'ডাল শস্য নাইট্রোজেন যোগ করে', 'दलहनी फसल नाइट्रोजन जोड़ती है')}
                </div>
                <div
                  style={{
                    padding: '0.8rem',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.82rem',
                    color: 'var(--color-text)'
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>
                    {t('Pest Cycle Break', 'পোকা-চক্র ভঙ্গ', 'कीट-चक्र नियंत्रण')}
                  </strong>
                  {plan.pestCycleBreak || t('Rotating crops disrupts pest buildup', 'ফসল আবর্তন পোকা বৃদ্ধি রোধ করে', 'फसल चक्र कीटों को रोकता है')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. What-If Simulation with Emptyable Inputs & Smart Location Report */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: '1rem', cursor: 'pointer' }}
          onClick={() => setShowSimulation(!showSimulation)}
        >
          <div className="flex items-center gap-2">
            <Sliders size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
              {t('Test Weather Scenarios (What-If Simulator + Smart AI Report)', 'আবহাওয়া পরিস্থিতি পরীক্ষা (সিমুলেটর ও স্মার্ট রিপোর্ট)', 'मौसम परिदृश्य सिम्युलेटर (What-If + स्मार्ट रिपोर्ट)')}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: showSimulation ? 'var(--color-primary)' : 'var(--color-text-muted)'
            }}
          >
            {showSimulation ? '▲' : '▼'}
          </span>
        </div>

        {showSimulation && (
          <>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.85rem' }}>
              {t(
                'Enter custom simulation numbers below (fields can be cleared completely). Kisan Sahayak AI will analyze your inputs for ',
                'নিচে আপনার সিমুলেশন সংখ্যা লিখুন (ঘরগুলো সম্পূর্ণ খালি রাখা যাবে)। কিষাণ সহায়ক এআই আপনার জমির অবস্থানের ভিত্তিতে রিপোর্ট দেবে — ',
                'नीचे अपने सिमुलेशन नंबर दर्ज करें (बॉक्स को पूरी तरह खाली भी रख सकते हैं)। किसान सहायक एआई आपके खेत के स्थान के आधार पर रिपोर्ट देगा — '
              )}
              <strong>{activeFarm.name} ({activeFarm.district})</strong>.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('Sowing Delay (days)', 'বপন বিলম্ব (দিন)', 'बुवाई में देरी (दिन)')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 12 (leave empty for 0)"
                  className="form-input"
                  value={delayDaysInput}
                  onChange={(e) => setDelayDaysInput(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('Temperature Offset (°C)', 'তাপমাত্রা পার্থক্য (°C)', 'तापमान अंतर (°C)')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g., 1.5 (leave empty for 0)"
                  className="form-input"
                  value={tempOffsetInput}
                  onChange={(e) => setTempOffsetInput(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('Rainfall Offset (%)', 'বৃষ্টিপাত পার্থক্য (%)', 'वर्षा अंतर (%)')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., -20 (leave empty for 0)"
                  className="form-input"
                  value={rainOffsetInput}
                  onChange={(e) => setRainOffsetInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={runSimulation}
                disabled={smartSimLoading}
                className="btn btn-primary"
              >
                {smartSimLoading ? <RefreshCw size={16} /> : <Sun size={16} />}
                <span>
                  {smartSimLoading
                    ? t('Analyzing Simulation...', 'সিমুলেশন বিশ্লেষণ চলছে...', 'सिमुलेशन का विश्लेषण हो रहा है...')
                    : t('Run Simulation & Smart Location Report', 'সিমুলেশন ও স্মার্ট রিপোর্ট চালান', 'सिमुलेशन और स्मार्ट रिपोर्ट चलाएं')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDelayDaysInput('');
                  setTempOffsetInput('');
                  setRainOffsetInput('');
                  setSimulationResult(null);
                  setSmartSimReport(null);
                  setSmartSimError('');
                }}
                className="btn btn-secondary"
              >
                {t('Clear Inputs', 'ইনপুট মুছুন', 'इनपुट साफ़ करें')}
              </button>
            </div>

            {smartSimError && (
              <div style={{ marginTop: '0.75rem', color: '#C62828', fontSize: '0.82rem' }}>
                {smartSimError}
              </div>
            )}

            {simulationResult && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  color: 'var(--color-text)'
                }}
              >
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.4rem' }}>
                  {t('Baseline Simulation Check', 'বেসলাইন সিমুলেশন ফলাফল', 'बेसलाइन सिमुलेशन परिणाम')}
                </strong>
                <div style={{ lineHeight: 1.6 }}>
                  {simulationResult.summary || t('Review how delay, heat, or rainfall changes affect your crop plan.', 'বিলম্ব, তাপ বা বৃষ্টিপাতের পরিবর্তন আপনার ফসল পরিকল্পনাকে কীভাবে প্রভাবিত করে তা পর্যালোচনা করুন।')}
                </div>
              </div>
            )}

            {smartSimReport && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1.15rem',
                  background: 'var(--color-success-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(46, 125, 50, 0.35)',
                  fontSize: '0.86rem',
                  color: 'var(--color-text)'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ color: 'var(--color-primary)', fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} />
                    <span>{smartSimReport.reportTitle}</span>
                  </strong>
                  <span className="badge badge-success">
                    Risk: {smartSimReport.riskLevel}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  {smartSimReport.locationContext}
                </div>
                <p style={{ lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {smartSimReport.impactSummary}
                </p>
                {Array.isArray(smartSimReport.recommendations) && smartSimReport.recommendations.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                    {smartSimReport.recommendations.map((rec, rIdx) => (
                      <li key={rIdx}>{rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <DataSourceCard
        sourceName="Open Weather & Crop Calendar Sources"
        product="Seasonal Crop Rotation Planner"
        resolution="District Level"
        observationDate="Current Season"
        coverage={activeFarm.district}
        dataState="SAMPLE DATA"
        caveat="Crop plans are agronomic recommendations based on regional calendars. Always check local market demand and certified seed availability before planting."
      />
    </div>
  );
}
