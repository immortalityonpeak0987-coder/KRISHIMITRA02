import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { recoveryService } from '../../services/recoveryService';
import { satelliteService } from '../../services/satelliteService';
import { soilService } from '../../services/soilService';
import DataSourceCard from '../../components/common/DataSourceCard';
import ActionPlanCard from '../../components/ai/ActionPlanCard';
import {
  Clock,
  Camera,
  CheckSquare,
  PlusCircle,
  CheckCircle2,
  Layers,
  FlaskConical,
  Upload,
  X,
  Info
} from 'lucide-react';

const RECOVERY_STAGES = [
  {
    id: 'BEFORE',
    labelEn: '1. Before the problem',
    labelBn: '১. সমস্যার পূর্বে',
    desc: 'Initial crop establishment and normal seasonal conditions'
  },
  {
    id: 'DURING',
    labelEn: '2. During the problem',
    labelBn: '২. সমস্যা চলাকালীন',
    desc: 'Heavy rainfall, waterlogging, tidal surge, or salinity stress event'
  },
  {
    id: 'RECOVERY',
    labelEn: '3. Recovery period',
    labelBn: '৩. পুনরুদ্ধার সময়কাল',
    desc: 'Drainage clearing, soil testing, mulching, and field preparation'
  },
  {
    id: 'CURRENT',
    labelEn: '4. Current condition',
    labelBn: '৪. বর্তমান অবস্থা',
    desc: 'Latest soil moisture status, relay sowing, or standing crop progress'
  }
];

const OBSERVATION_CATEGORIES = [
  { value: 'waterlogging', label: 'Waterlogging (জলমগ্নতা)' },
  { value: 'drainage', label: 'Drainage cleared (জল নিষ্কাশন)' },
  { value: 'soil_condition', label: 'Soil condition / Salinity (মাটির অবস্থা)' },
  { value: 'crop_condition', label: 'Crop condition / Greenness (ফলের অবস্থা)' },
  { value: 'replanting', label: 'Replanting / Next sowing (পুনরায় বপন)' },
  { value: 'harvest_status', label: 'Harvest status (ফসল কাটা)' }
];

export default function RecoveryPage() {
  const { activeFarm, t } = useFarm();
  const [timelineData, setTimelineData] = useState(null);
  const [satData, setSatData] = useState(null);
  const [soilData, setSoilData] = useState(null);

  const [selectedStage, setSelectedStage] = useState('CURRENT');
  const [obsCategory, setObsCategory] = useState('drainage');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [milestoneSaved, setMilestoneSaved] = useState(false);

  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistUpdatingId, setChecklistUpdatingId] = useState(null);

  const loadRecovery = async (farm) => {
    if (!farm) return;
    try {
      const [recRes, satRes, sRes] = await Promise.all([
        recoveryService.getRecoveryTimeline(farm.id),
        satelliteService.getSatelliteObservations(farm.id),
        soilService.getSoilData(farm.id)
      ]);
      setTimelineData(recRes.data);
      setSatData(satRes.data);
      setSoilData(sRes.data);

      if (Array.isArray(recRes.data?.checklist) && recRes.data.checklist.length > 0) {
        setChecklistItems(recRes.data.checklist);
      } else {
        setChecklistItems([
          {
            id: 'chk-1',
            key: 'grainMoistureChecked',
            title: 'Dry harvested grain below 14% moisture before storage',
            desc: 'Sun-dry harvested Aman paddy grain below 14% moisture to prevent fungal spoilage.',
            status: 'Completed'
          },
          {
            id: 'chk-2',
            key: 'drainageFurrowsCleaned',
            title: 'Clear perimeter drainage channels',
            desc: 'Open field drainage channels so excess surface water drains before winter sowing.',
            status: 'Completed'
          },
          {
            id: 'chk-3',
            key: 'mulchApplied',
            title: 'Keep paddy straw mulch on soil surface (15–20 cm)',
            desc: 'Retain crop residue mulch to conserve soil moisture and reduce salt rise.',
            status: 'In progress'
          },
          {
            id: 'chk-4',
            key: 'postHarvestStoragePrepared',
            title: 'Prepare certified winter pulse or mustard seed',
            desc: 'Collect certified Mustard (B-9), Lentil, or Khesari seed for timely Rabi sowing.',
            status: 'Pending'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load recovery timeline:', err);
    }
  };

  useEffect(() => {
    loadRecovery(activeFarm);
  }, [activeFarm]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleChecklistStatusChange = async (item, newStatus) => {
    const optimistic = checklistItems.map((c) =>
      c.id === item.id || c.key === item.key ? { ...c, status: newStatus } : c
    );
    setChecklistItems(optimistic);
    setChecklistUpdatingId(item.id || item.key);
    try {
      const res = await recoveryService.updateChecklist(activeFarm.id, {
        taskId: item.id,
        key: item.key,
        status: newStatus
      });
      if (res?.checklist) {
        setChecklistItems(res.checklist);
      }
    } catch (e) {
      console.warn('Checklist update fallback to local state:', e.message);
    } finally {
      setChecklistUpdatingId(null);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() && !newMilestoneDesc.trim()) return;
    const categoryObj = OBSERVATION_CATEGORIES.find((c) => c.value === obsCategory);

    await recoveryService.logFieldObservation(activeFarm.id, {
      title: newMilestoneTitle.trim() || `${categoryObj?.label || 'Field Observation'}`,
      description:
        newMilestoneDesc.trim() ||
        'Field condition verified and recorded during farm recovery check.',
      phase: selectedStage,
      observationType: obsCategory,
      eventType: obsCategory.toUpperCase(),
      photoUrl: photoPreview || null
    });

    setNewMilestoneTitle('');
    setNewMilestoneDesc('');
    setPhotoPreview(null);
    await loadRecovery(activeFarm);
    setMilestoneSaved(true);
    setTimeout(() => setMilestoneSaved(false), 3500);
  };

  if (!activeFarm || !timelineData) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text)' }}>
        {t('Loading farm recovery progress...', 'খামার পুনরুদ্ধার অগ্রগতি লোড করা হচ্ছে...')}
      </div>
    );
  }

  const events = timelineData.events || [];
  const completedTasks = checklistItems.filter((i) => i.status === 'Completed').length;
  const inProgressTasks = checklistItems.filter((i) => i.status === 'In progress').length;
  const pendingTasks = checklistItems.filter((i) => i.status === 'Pending').length;

  const latestLab = soilData?.latestLabTest || soilData?.labTest || {};

  const eventsByStage = {
    BEFORE: [],
    DURING: [],
    RECOVERY: [],
    CURRENT: []
  };

  events.forEach((evt, idx) => {
    const phase = evt.phase
      ? evt.phase
      : idx === events.length - 1
      ? 'BEFORE'
      : String(evt.type).includes('SHOCK') || String(evt.type).includes('ALERT')
      ? 'DURING'
      : idx === 0
      ? 'CURRENT'
      : 'RECOVERY';
    if (eventsByStage[phase]) {
      eventsByStage[phase].push(evt);
    } else {
      eventsByStage.CURRENT.push(evt);
    }
  });

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '1.35rem', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            {t('My Farm Recovery Progress', 'আমার খামারের পুনরুদ্ধার অগ্রগতি')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {t('Track your farm before, during, and after heavy rain or salinity problems.', 'বর্ষা বা লবণাক্ততার সমস্যার আগে, চলাকালীন ও পরে আপনার খামারের অগ্রগতি ট্র্যাক করুন।')}
          </p>
        </div>
        <div>
          <span className="badge badge-success">{timelineData.currentStatus}</span>
        </div>
      </div>

      <ActionPlanCard
        planType="recovery"
        scenarioParams={{
          currentStatus: timelineData.currentStatus,
          completedTasks,
          pendingTasks
        }}
      />

      {/* 4 SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
        {/* 1. Tasks */}
        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              1. {t('Recorded Tasks', 'রেকর্ডকৃত কাজ')}
            </span>
            <CheckSquare size={17} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {completedTasks} / {checklistItems.length} {t('Done', 'সম্পন্ন')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {inProgressTasks} {t('In progress', 'চলছে')} • {pendingTasks} {t('Pending', 'অপেক্ষা')}
          </div>
        </div>

        {/* 2. Observations */}
        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              2. {t('Field Observations', 'মাঠ পর্যবেক্ষণ')}
            </span>
            <Camera size={17} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {events.length} {t('Logged', 'লগ করা')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {t('Across 4 seasonal stages', '৪ মৌসুমীয় ধাপ জুড়ে')}
          </div>
        </div>

        {/* 3. Soil Moisture */}
        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              3. {t('Soil Moisture', 'মাটির আর্দ্রতা')}
            </span>
            <Layers size={17} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {satData?.smapSoilMoisture?.rootZoneMoisture?.split(' ')[0] || '0.32'} cm³/cm³
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {t('Regional estimate', 'অঞ্চলীয় অনুমান')}
          </div>
        </div>

        {/* 4. Soil Lab */}
        <div className="card" style={{ padding: '1.1rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              4. {t('Soil Lab Status', 'মাটি ল্যাব অবস্থা')}
            </span>
            <FlaskConical size={17} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text)' }}>
            pH {latestLab.ph ?? '6.5'} • EC {latestLab.electricalConductivity ?? latestLab.ecDsM ?? '0.35'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {latestLab.salinityClass || 'Non-Saline'}
          </div>
        </div>
      </div>

      {/* Transparency Note */}
      <div className="alert-strip alert-strip-info" style={{ marginBottom: '1.5rem' }}>
        <Info size={18} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem' }}>
          <strong>{t('Transparent Progress Tracking:', 'স্বচ্ছ অগ্রগতি ট্র্যাকিং:')} </strong>
          {t('Completing field preparation tasks updates your recorded tasks count. It never changes satellite soil moisture or laboratory soil chemistry measurements.', 'ক্ষেত্র প্রস্তুতি কাজ সম্পন্ন করলে আপনার রেকর্ডকৃত কাজের সংখ্যা আপডেট হয়। এটি উপগ্রহ মাটি আর্দ্রতা বা ল্যাব মাটি রসায়ন পরিমাপ কখনোই পরিবর্তন করে না।')}
        </div>
      </div>

      {/* 4-STAGE TIMELINE BOARD */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={20} style={{ color: 'var(--color-primary)' }} />
            <span>{t('4-Stage Farm Recovery Timeline', '৪-ধাপের খামার পুনরুদ্ধার টাইমলাইন')}</span>
          </h3>
          <span className="badge badge-success">{events.length} {t('OBSERVATIONS', 'পরীক্ষণ')}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {RECOVERY_STAGES.map((stage) => {
            const stageEvents = eventsByStage[stage.id] || [];
            const stageColor = stage.id === 'BEFORE' ? 'var(--color-primary)' : stage.id === 'DURING' ? '#B07525' : stage.id === 'RECOVERY' ? 'var(--color-primary)' : '#C62828';
            return (
              <div
                key={stage.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)'
                }}
              >
                <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: stageColor
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: stageColor,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {t(stage.labelEn, stage.labelBn)}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  {t(stage.desc, stage.desc)}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {stageEvents.length > 0 ? (
                    stageEvents.map((evt, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.5rem 0.75rem',
                          background: 'var(--color-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          color: 'var(--color-text)'
                        }}
                      >
                        <strong>{evt.title}</strong>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {evt.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      {t('No observations recorded yet.', 'এখনও কোনো পর্যবেক্ষণ রেকর্ড করা হয়নি।')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <CheckCircle2 size={20} style={{ color: 'var(--color-primary)' }} />
            <span>{t('Recovery Checklist', 'পুনরুদ্ধার চেকলিস্ট')}</span>
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {checklistItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const next = item.status === 'Completed' ? 'Pending' : item.status === 'Pending' ? 'In progress' : 'Completed';
                  handleChecklistStatusChange(item, next);
                }}
                disabled={checklistUpdatingId === item.id}
                style={{
                  padding: '0.25rem',
                  borderRadius: '4px',
                  background: item.status === 'Completed' ? 'var(--color-primary)' : 'transparent',
                  border: item.status === 'Completed' ? 'none' : '1px solid var(--color-border)',
                  cursor: 'pointer'
                }}
              >
                {item.status === 'Completed' ? <CheckCircle2 size={16} style={{ color: '#FFFFFF' }} /> : ''}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: item.status === 'Completed' ? 'var(--color-primary)' : 'var(--color-text)', textDecoration: item.status === 'Completed' ? 'line-through' : 'none' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  {item.desc}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  background: item.status === 'Completed' ? 'var(--color-success-bg)' : item.status === 'In progress' ? 'var(--color-warning-bg)' : 'var(--color-surface)',
                  color: item.status === 'Completed' ? 'var(--color-primary)' : item.status === 'In progress' ? '#B07525' : 'var(--color-text-muted)',
                  border: `1px solid ${item.status === 'Completed' ? 'rgba(46, 125, 50, 0.3)' : item.status === 'In progress' ? 'rgba(176, 117, 37, 0.3)' : 'var(--color-border)'}`
                }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Observation */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} />
            <span>{t('Add New Observation', 'নতুন পর্যবেক্ষণ যোগ করুন')}</span>
          </h3>
        </div>
        <form onSubmit={handleAddMilestone} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('Stage', 'ধাপ')}</label>
              <select className="form-select" value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}>
                {RECOVERY_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{t(s.labelEn, s.labelBn)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('Category', 'বিভাগ')}</label>
              <select className="form-select" value={obsCategory} onChange={(e) => setObsCategory(e.target.value)}>
                {OBSERVATION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('Title', 'শিরোনাম')}</label>
            <input
              className="form-input"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder={t('e.g., Cleared drainage channel', 'যেমন, জল নিষ্কাশন চ্যানেল পরিষ্কার')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('Description', 'বিবরণ')}</label>
            <textarea
              className="form-input"
              rows={2}
              value={newMilestoneDesc}
              onChange={(e) => setNewMilestoneDesc(e.target.value)}
              placeholder={t('What did you observe in the field?', 'খেতে আপনি কী দর্শন করেছেন?')}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">{t('Photo (Optional)', 'ছবি (ঐচ্ছিক)')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Observation" style={{ maxWidth: '150px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
                  <button type="button" onClick={() => setPhotoPreview(null)} className="btn btn-sm btn-danger">
                    {t('Remove', 'অপসারণ')}
                  </button>
                </>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <Upload size={16} />
                  <span>{t('Choose photo', 'ছবি বেছে নিন')}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>
          {milestoneSaved && (
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.5rem', display: 'block' }}>
              ✓ {t('Observation saved!', 'পরীক্ষণ সংরক্ষিত!')}
            </span>
          )}
          <button type="submit" className="btn btn-primary">
            {t('Save Observation', 'পরীক্ষণ সেভ করুন')}
          </button>
        </form>
      </div>

      <DataSourceCard
        sourceName="Open Weather, Satellite & Soil Sources"
        product="Farm Recovery Context"
        resolution="Regional Grid"
        observationDate="Current Season"
        coverage={activeFarm.district}
        dataState="SAMPLE DATA"
        caveat="Recovery tracking combines farmer observations with regional weather and soil context. Verify with local agricultural officers for critical decisions."
      />
    </div>
  );
}
