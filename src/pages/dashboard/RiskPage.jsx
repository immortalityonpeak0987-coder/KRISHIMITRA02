import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { riskService } from '../../services/riskService';
import { soilService } from '../../services/soilService';
import { recoveryService } from '../../services/recoveryService';
import { aiService, buildFarmContextPayload } from '../../services/aiService';
import DataSourceCard from '../../components/common/DataSourceCard';
import PhotoDiagnosisCard from '../../components/ai/PhotoDiagnosisCard';
import {
  AlertTriangle,
  Camera,
  Upload,
  X,
  CheckCircle2,
  FlaskConical,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function RiskPage() {
  const { activeFarm, language, t } = useFarm();
  const [riskData, setRiskData] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoNote, setPhotoNote] = useState('');
  const [photoType, setPhotoType] = useState('Field Drainage & Emergence');
  const [photoSubmitted, setPhotoSubmitted] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const [soilEntryMode, setSoilEntryMode] = useState('simulation');

  const [labForm, setLabForm] = useState({
    testDate: new Date().toISOString().split('T')[0],
    labName: 'District Krishi Vigyan Kendra (KVK) Soil Lab',
    ph: '',
    ec: '',
    nitrogenKgHa: '',
    phosphorusKgHa: '25',
    potassiumKgHa: '200',
    organicCarbonPct: '0.68'
  });
  const [labSubmitted, setLabSubmitted] = useState(false);
  const [labError, setLabError] = useState('');
  const [simExplanation, setSimExplanation] = useState(null);
  const [smartSoilReport, setSmartSoilReport] = useState(null);
  const [smartSoilLoading, setSmartSoilLoading] = useState(false);

  const loadRiskAndSoil = async (farm) => {
    if (!farm) return;
    try {
      const [rRes, sRes] = await Promise.all([
        riskService.getRiskAssessment(farm.id),
        soilService.getSoilData(farm.id)
      ]);
      setRiskData(rRes.data);
      setSoilData(sRes.data);
    } catch (err) {
      console.error('Failed to load risk data:', err);
    }
  };

  useEffect(() => {
    loadRiskAndSoil(activeFarm);
  }, [activeFarm]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      const objectUrl = URL.createObjectURL(file);
      setPhotoPreview(objectUrl);
      setPhotoError('');
    }
  };

  const handleClearPhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };

  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    if (!photoNote.trim()) {
      setPhotoError('Please enter field observation notes before logging evidence.');
      return;
    }
    setPhotoError('');
    try {
      await recoveryService.logFieldObservation(activeFarm.id, {
        title: `${photoType} — Ground Truth Log`,
        description: photoNote.trim(),
        type: 'Farmer Observation',
        phase: 'CURRENT'
      });
      setPhotoSubmitted(true);
      setPhotoNote('');
      setTimeout(() => setPhotoSubmitted(false), 4500);
    } catch (err) {
      setPhotoError(err.message || 'Could not save field observation.');
    }
  };

  const buildPlainLanguageSoilBreakdown = (formVals) => {
    const phVal = parseFloat(formVals.ph);
    const ecVal = parseFloat(formVals.ec);
    const nVal = parseFloat(formVals.nitrogenKgHa);
    const pVal = parseFloat(formVals.phosphorusKgHa);
    const kVal = parseFloat(formVals.potassiumKgHa);

    const missingFields = [];
    if (Number.isNaN(nVal)) missingFields.push('Nitrogen (N)');
    if (Number.isNaN(pVal)) missingFields.push('Phosphorus (P)');
    if (Number.isNaN(kVal)) missingFields.push('Potassium (K)');

    const phMeaning =
      phVal < 5.5
        ? 'Acidic soil — may limit phosphorus uptake; consider agricultural lime or organic compost.'
        : phVal > 7.5
        ? 'Slightly alkaline soil — common in coastal areas; avoid excess chemical urea.'
        : 'Balanced neutral pH (5.5–7.5) — ideal for rice, potato, mustard, and pulses.';

    const ecMeaning =
      ecVal >= 4.0
        ? 'High salt level in soil (EC ≥ 4.0 dS/m) — sensitive crops like potato or Boro rice may fail. Grow salt-tolerant pulses (Khesari/Moong) and keep paddy straw mulch on the soil.'
        : ecVal >= 2.0
        ? 'Mild salinity (EC 2.0–4.0 dS/m) — avoid heavy groundwater pumping; choose Mustard or tolerant pulses.'
        : 'Low salt / sweet soil (EC < 2.0 dS/m) — safe for all standard winter crops including potato, mustard, and vegetables.';

    const nMeaning = Number.isNaN(nVal)
      ? 'Not provided — Nitrogen level is needed to decide urea/compost dose.'
      : nVal < 280
      ? `Low Nitrogen (${nVal} kg/ha) — include a legume/pulse crop (Moong, Lentil, Khesari) in rotation to naturally add nitrogen to the soil.`
      : nVal <= 560
      ? `Medium Nitrogen (${nVal} kg/ha) — good baseline fertility.`
      : `High Nitrogen (${nVal} kg/ha) — reduce nitrogen fertilizer to prevent crop lodging.`;

    const pkMeaning =
      Number.isNaN(pVal) || Number.isNaN(kVal)
        ? 'Phosphorus or Potassium value not entered — regional baseline will be used until lab results are added.'
        : `Phosphorus (${pVal} kg/ha) supports root growth; Potassium (${kVal} kg/ha) helps crops resist drought and disease.`;

    return {
      phMeaning,
      ecMeaning,
      nMeaning,
      pkMeaning,
      missingFields,
      isSimulation: soilEntryMode === 'simulation'
    };
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    const phNum = parseFloat(labForm.ph);
    const ecNum = parseFloat(labForm.ec);
    if (Number.isNaN(phNum) || phNum < 3.0 || phNum > 10.5) {
      setLabError('Please enter a soil pH number between 3.0 and 10.5.');
      return;
    }
    if (Number.isNaN(ecNum) || ecNum < 0 || ecNum > 30) {
      setLabError('Please enter a soil salinity (EC) number between 0.0 and 30.0 dS/m.');
      return;
    }
    setLabError('');
    const breakdown = buildPlainLanguageSoilBreakdown(labForm);
    setSimExplanation(breakdown);
    setSmartSoilLoading(true);

    try {
      await soilService.submitLabTest(activeFarm.id, {
        ph: phNum,
        ecDsM: ecNum,
        nitrogenKgHa: parseFloat(labForm.nitrogenKgHa) || 220,
        phosphorusKgHa: parseFloat(labForm.phosphorusKgHa) || 25,
        potassiumKgHa: parseFloat(labForm.potassiumKgHa) || 200,
        organicCarbonPct: parseFloat(labForm.organicCarbonPct) || 0.65,
        labName: labForm.labName,
        testDate: labForm.testDate,
        isSimulation: soilEntryMode === 'simulation'
      });
      await loadRiskAndSoil(activeFarm);
      setLabSubmitted(true);
      setTimeout(() => setLabSubmitted(false), 4500);

      const farmContext = buildFarmContextPayload(activeFarm, {
        soil: { ph: phNum, ec: `${ecNum} dS/m` }
      });
      const aiReport = await aiService.analyzeSimulation({
        farmContext,
        simulationType: 'Soil pH, Salinity (EC) & Nitrogen Lab Simulation',
        simulationInputs: {
          soilPh: phNum,
          salinityEcDsM: ecNum,
          nitrogenKgHa: labForm.nitrogenKgHa || 'Not entered (using regional baseline)',
          entryMode: soilEntryMode
        },
        language: language || 'en'
      });
      setSmartSoilReport(aiReport);
    } catch (err) {
      setLabError(err.message || 'Failed to evaluate soil test.');
    } finally {
      setSmartSoilLoading(false);
    }
  };

  if (!activeFarm || !riskData) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text)' }}>
        {t('Checking farm weather, soil & salinity risks...', 'খামারের আবহাওয়া, মাটি ও লবণাক্ততা ঝুঁকি যাচাই করা হচ্ছে...')}
      </div>
    );
  }

  const isCoastal = activeFarm.district.includes('24 Parganas');
  const labTest = soilData?.labTest || soilData?.latestLabTest || {};
  const ecValue = Number(labTest.ecDsM ?? labTest.electricalConductivity ?? (isCoastal ? 4.8 : 0.85));
  const phValue = Number(labTest.ph ?? (isCoastal ? 7.6 : 6.4));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.35rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          {t('Soil Test & Risk Check', 'মাটি পরীক্ষা ও ঝুঁকি যাচাই')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
          {t('Check waterlogging, heat, and soil salinity risks, and try soil test numbers to see what they mean for your next crop.', 'জলমগ্নতা, তাপ এবং মাটির লবণাক্ততার ঝুঁকি যাচাই করুন, এবং মাটি পরীক্ষার সংখ্যাগুলো চেষ্টা করে দেখুন যেন আপনার পরবর্তী ফসলের জন্য এেগুলোর অর্থ বুঝতে পারেন।')}
        </p>
      </div>

      {/* RISK SUMMARY ALERT */}
      <div
        className={`alert-strip ${isCoastal || ecValue >= 4.0 ? 'alert-strip-warning' : 'alert-strip-info'}`}
        style={{ marginBottom: '1.5rem' }}
      >
        <AlertTriangle size={20} style={{ flexShrink: 0 }} />
        <div>
          <strong>{t('Overall Farm Risk Level:', 'খামারের সামগ্রিক ঝুঁকির স্তর:')} {riskData.overallRiskLevel}</strong>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
            {isCoastal || ecValue >= 4.0
              ? `High Soil Salinity (EC = ${ecValue} dS/m): Dry-season salt rise can harm sensitive winter crops. Grow salt-tolerant pulses (Khesari / Moong) and keep paddy straw mulch on the field.`
              : `Normal Non-Saline Soil (EC = ${ecValue} dS/m): Salt risk is low. Focus on saving winter soil moisture and rotating rice with pulses or oilseeds.`}
          </p>
        </div>
      </div>

      <PhotoDiagnosisCard soilSummary={{ ph: phValue, ec: `${ecValue} dS/m` }} />

      {/* RISK FACTORS */}
      <div className="grid grid-cols-2 gap-6" style={{ marginBottom: '1.5rem' }}>
        {(riskData.riskFactors || []).map((rf, idx) => {
          const isHigh = rf.level?.includes('High') || rf.level?.includes('Severe');
          const isMod = rf.level?.includes('Moderate');
          const badgeColor = isHigh ? '#C62828' : isMod ? '#B07525' : 'var(--color-primary)';

          return (
            <div
              key={idx}
              className="card"
              style={{
                borderLeft: `4px solid ${isHigh ? '#C62828' : isMod ? '#B07525' : 'var(--color-primary)'}`
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '1.05rem', color: 'var(--color-text)' }}>{rf.category}</strong>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    background: isHigh ? 'var(--color-danger-bg)' : isMod ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                    color: badgeColor,
                    border: `1px solid ${badgeColor}`
                  }}
                >
                  {rf.level}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem' }}>
                <strong>{t('What we noticed:', 'আমরা কী লক্ষ্য করেছি:')} </strong>{rf.indicator}
              </p>
              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text)'
                }}
              >
                <strong>{t('What you can do:', 'আপনি কী করতে পারেন:')} </strong>{rf.recommendation}
              </div>
            </div>
          );
        })}
      </div>

      {/* SOIL TEST SECTION */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        {/* Left: Current Soil Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FlaskConical size={20} style={{ color: 'var(--color-primary)' }} />
              <span>{t('Current Soil Health & Salinity', 'বর্তমান মাটির স্বাস্থ্য ও লবণাক্ততা')}</span>
            </h3>
            <span className={`badge ${labTest.isSimulation ? 'badge-warning' : 'badge-success'}`}>
              {labTest.isSimulation
                ? t('SAMPLE SIMULATION', 'নমুনা সিমুলেশন')
                : labTest.isVerifiedLab
                ? t('VERIFIED LAB RECORD', 'যাচাইকৃত ল্যাব রেকর্ড')
                : t('REGIONAL BASELINE', 'অঞ্চলীয় মৌলিক')}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}
          >
            <div
              style={{
                padding: '0.8rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                {t('Soil Salinity (EC)', 'মাটির লবণাক্ততা (EC)')}
              </span>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: ecValue >= 4.0 ? '#C62828' : 'var(--color-primary)',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {ecValue} dS/m
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: ecValue >= 4.0 ? '#C62828' : 'var(--color-primary)'
                }}
              >
                {ecValue >= 4.0 ? '⚠ High salt' : '✓ Low salt'}
              </span>
            </div>

            <div
              style={{
                padding: '0.8rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                {t('Soil pH', 'মাটির pH')}
              </span>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: phValue < 5.5 || phValue > 7.5 ? '#B07525' : 'var(--color-primary)',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                {phValue}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {phValue < 5.5 ? 'Acidic' : phValue > 7.5 ? 'Alkaline' : 'Neutral'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Try a Soil Test */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FlaskConical size={20} style={{ color: 'var(--color-primary)' }} />
              <span>{t('Try Soil Test Numbers', 'মাটি পরীক্ষার সংখ্যার পরীক্ষা')}</span>
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setSoilEntryMode('simulation')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: soilEntryMode === 'simulation' ? 'var(--color-primary)' : 'transparent',
                  color: soilEntryMode === 'simulation' ? '#FFFFFF' : 'var(--color-text-muted)',
                  border: 'none'
                }}
              >
                {t('Sample', 'নমুনা')}
              </button>
              <button
                type="button"
                onClick={() => setSoilEntryMode('verified')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: soilEntryMode === 'verified' ? 'var(--color-primary)' : 'transparent',
                  color: soilEntryMode === 'verified' ? '#FFFFFF' : 'var(--color-text-muted)',
                  border: 'none'
                }}
              >
                {t('Lab Record', 'ল্যাব রেকর্ড')}
              </button>
            </div>
          </div>

          <form onSubmit={handleLabSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('Soil pH', 'মাটির pH', 'मिट्टी का pH')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g., 6.5 (3.0 - 10.5)"
                className="form-input"
                value={labForm.ph}
                onChange={(e) => setLabForm({ ...labForm, ph: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Soil Salinity EC (dS/m)', 'মাটির লবণাক্ততা EC', 'मिट्टी की लवणता EC (dS/m)')}</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g., 0.85 (0.0 - 30.0)"
                className="form-input"
                value={labForm.ec}
                onChange={(e) => setLabForm({ ...labForm, ec: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Nitrogen N (kg/ha)', 'নাইট্রোজেন N', 'नाइट्रोजन N (kg/ha)')}</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g., 220 (optional)"
                className="form-input"
                value={labForm.nitrogenKgHa}
                onChange={(e) => setLabForm({ ...labForm, nitrogenKgHa: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Lab Name', 'ল্যাবের নাম', 'लैब का नाम')}</label>
              <input
                type="text"
                className="form-input"
                value={labForm.labName}
                onChange={(e) => setLabForm({ ...labForm, labName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('Test Date', 'পরীক্ষার তারিখ', 'परीक्षण तिथि')}</label>
              <input
                type="date"
                className="form-input"
                value={labForm.testDate}
                onChange={(e) => setLabForm({ ...labForm, testDate: e.target.value })}
              />
            </div>
            {labError && <span className="form-error">{labError}</span>}
            <div className="flex items-center gap-2" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button type="submit" disabled={smartSoilLoading} className="btn btn-primary">
                {smartSoilLoading ? <RefreshCw size={15} /> : <Sparkles size={15} />}
                <span>
                  {smartSoilLoading
                    ? t('Analyzing Soil...', 'বিশ্লেষণ চলছে...', 'विश्लेषण कर रहा है...')
                    : t('Evaluate & Generate Smart Report', 'মাটি পরীক্ষা ও স্মার্ট রিপোর্ট', 'मिट्टी जांचें और स्मार्ट रिपोर्ट पाएं')}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setLabForm((prev) => ({ ...prev, ph: '', ec: '', nitrogenKgHa: '' }));
                  setSimExplanation(null);
                  setSmartSoilReport(null);
                  setLabError('');
                }}
              >
                {t('Clear Inputs', 'মুছুন', 'साफ़ करें')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Explanation & Smart Location Report */}
      {simExplanation && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
              <span>{t('What These Numbers Mean & Smart Location Report', 'এই সংখ্যাগুলোর অর্থ ও স্মার্ট অবস্থান রিপোর্ট', 'इन नंबरों का अर्थ और स्मार्ट स्थान रिपोर्ट')}</span>
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: smartSoilReport ? '1.15rem' : 0 }}>
            <div>
              <strong style={{ color: 'var(--color-primary)' }}>{t('pH:', 'pH:')} </strong>
              <span style={{ color: 'var(--color-text)' }}>{simExplanation.phMeaning}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--color-primary)' }}>{t('Salinity:', 'লবণাক্ততা:')} </strong>
              <span style={{ color: 'var(--color-text)' }}>{simExplanation.ecMeaning}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--color-primary)' }}>{t('Nitrogen:', 'নাইট্রোজেন:')} </strong>
              <span style={{ color: 'var(--color-text)' }}>{simExplanation.nMeaning}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--color-primary)' }}>{t('P & K:', 'ফসফরাস ও পটাশ:')} </strong>
              <span style={{ color: 'var(--color-text)' }}>{simExplanation.pkMeaning}</span>
            </div>
          </div>

          {smartSoilReport && (
            <div
              style={{
                padding: '1.1rem',
                background: 'var(--color-success-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(46, 125, 50, 0.35)',
                fontSize: '0.86rem',
                color: 'var(--color-text)'
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <strong style={{ color: 'var(--color-primary)', fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} />
                  <span>{smartSoilReport.reportTitle}</span>
                </strong>
                <span className="badge badge-success">Risk: {smartSoilReport.riskLevel}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.45rem' }}>
                {smartSoilReport.locationContext}
              </div>
              <p style={{ lineHeight: 1.6, marginBottom: '0.65rem' }}>
                {smartSoilReport.impactSummary}
              </p>
              {Array.isArray(smartSoilReport.recommendations) && smartSoilReport.recommendations.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                  {smartSoilReport.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Field Observation */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Camera size={20} style={{ color: 'var(--color-primary)' }} />
            <span>{t('Field Observation Photo', 'মাঠের পর্যবেক্ষণ ছবি')}</span>
          </h3>
        </div>
        <form onSubmit={handlePhotoSubmit} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">{t('Observation Type', 'পর्यवेक्षणের প্রকার')}</label>
            <select
              className="form-select"
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value)}
            >
              <option value="Field Drainage & Emergence">{t('Field Drainage & Emergence', 'ক্ষেত্র নিষ্কাশন ও উদ્ઘাটন')}</option>
              <option value="Waterlogging">{t('Waterlogging', 'জলমগ্নতা')}</option>
              <option value="Soil Condition">{t('Soil Condition', 'মাটির অবস্থা')}</option>
              <option value="Crop Condition">{t('Crop Condition', 'ফলের অবস্থা')}</option>
              <option value="Harvest Status">{t('Harvest Status', 'ফসল কাটার অবস্থা')}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('Notes', 'নোট')}</label>
            <textarea
              className="form-input"
              rows={3}
              value={photoNote}
              onChange={(e) => setPhotoNote(e.target.value)}
              placeholder="Describe what you see in the field..."
            />
            {photoError && <span className="form-error">{photoError}</span>}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            {photoPreview ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <img src={photoPreview} alt="Field observation" style={{ maxWidth: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
                <button type="button" onClick={handleClearPhoto} className="btn btn-sm btn-danger">
                  {t('Remove', 'অপসারণ')}
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <Upload size={16} />
                <span>{t('Choose field photo', 'খেতের ছবি বেছে নিন')}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
            )}
            {photoSubmitted && (
              <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.84rem' }}>
                ✓ {t('Observation saved!', 'পরীক্ষণ সংরক্ষিত!')}
              </span>
            )}
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              {t('Log Field Observation', 'মাঠের পর্যবেক্ষণ লগ করুন')}
            </button>
          </div>
        </form>
      </div>

      <DataSourceCard
        sourceName="Open Weather, Soil & Hazard Sources"
        product="Multi-Hazard Risk Screening"
        resolution="Regional Grid"
        observationDate="Current Season"
        coverage={activeFarm.district}
        dataState="SAMPLE DATA"
        caveat="Risk screening is heuristic and should be verified with local agricultural officers and laboratory soil tests before making treatment decisions."
      />
    </div>
  );
}
