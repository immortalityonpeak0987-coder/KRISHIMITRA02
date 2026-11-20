import React, { useState } from 'react';
import { Camera, Sparkles, Upload, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { aiService, buildFarmContextPayload } from '../../services/aiService';

const SAMPLE_PRESETS = [
  {
    id: 'yellow-leaf',
    labelEn: 'Yellowing Paddy Leaf Tips',
    labelBn: 'ধানের পাতার ডগা হলুদ হওয়া',
    labelHi: 'धान की पत्तियों का पीला पड़ना',
    description: 'Lower and middle rice leaves showing yellow-orange tips and stunted tillering after standing water.'
  },
  {
    id: 'white-crust',
    labelEn: 'White Soil Surface Crust (Salinity)',
    labelBn: 'মাটির উপরে সাদা লবণের স্তর',
    labelHi: 'मिट्टी की सतह पर सफेद नमक की परत',
    description: 'Patchy white salt efflorescence on topsoil ridge with slow seedling emergence in dry spell.'
  },
  {
    id: 'waterlogged-root',
    labelEn: 'Waterlogged Furrow & Root Stress',
    labelBn: 'জলমগ্ন নালা ও শিকড়ের পচন ঝুঁকি',
    labelHi: 'जलभराव और जड़ सड़न का जोखिम',
    description: 'Standing water in field furrows for 4+ days causing lower stem browning and root oxygen stress.'
  }
];

export default function PhotoDiagnosisCard({ soilSummary = {} }) {
  const { activeFarm, language, t } = useFarm();
  const [selectedPreset, setSelectedPreset] = useState(SAMPLE_PRESETS[0].id);
  const [symptomNote, setSymptomNote] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [imageName, setImageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleRunDiagnosis = async () => {
    if (!activeFarm) return;
    setLoading(true);
    setError('');
    try {
      const presetObj = SAMPLE_PRESETS.find((p) => p.id === selectedPreset);
      const farmContext = buildFarmContextPayload(activeFarm, {
        soil: soilSummary
      });
      const res = await aiService.diagnoseFieldPhoto({
        farmContext,
        imageBase64,
        mimeType: imageMimeType,
        symptomNote,
        conditionPreset: presetObj ? `${presetObj.labelEn}: ${presetObj.description}` : '',
        language
      });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to run smart photo diagnosis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <h3 className="card-title">
          <Camera size={20} style={{ color: 'var(--color-primary)' }} />
          <span>
            {t(
              'Smart Crop Leaf & Soil Photo Diagnosis',
              'স্মার্ট ফসলের পাতা ও মাটির ছবি নির্ণয়',
              'स्मार्ट फसल पत्ती और मिट्टी फोटो निदान'
            )}
          </span>
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {activeFarm?.currentCrop} · {activeFarm?.district}
        </span>
      </div>

      <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        {t(
          'Upload a crop leaf or soil photo (or choose a common field condition preset below) for an instant Kisan Sahayak agronomic diagnosis.',
          'ফসলের পাতা বা মাটির ছবি আপলোড করুন (অথবা নিচের যেকোনো একটি সাধারণ সমস্যা বেছে নিন) তাৎক্ষণিক স্মার্ট কৃষি নির্ণয়ের জন্য।',
          'तत्काल स्मार्ट कृषि निदान के लिए फसल की पत्ती या मिट्टी की फोटो अपलोड करें (या नीचे दी गई सामान्य स्थिति चुनें)।'
        )}
      </p>

      {/* Preset Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.45rem' }}>
          {t('1. Select Observed Field Condition Preset:', '১. মাঠের পর্যবেক্ষণ বেছে নিন:', '1. खेत की स्थिति चुनें:')}
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          {SAMPLE_PRESETS.map((preset) => {
            const active = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset.id)}
                style={{
                  padding: '0.45rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: active ? 'var(--color-success-bg)' : 'var(--color-background)',
                  color: 'var(--color-text)',
                  fontSize: '0.8rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {language === 'bn' ? preset.labelBn : language === 'hi' ? preset.labelHi : preset.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload + Symptom Note */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '0.35rem'
            }}
          >
            {t('2. Optional Crop / Soil Photo Upload:', '২. ফসলের পাতা / মাটির ছবি আপলোড (ঐচ্ছিক):', '2. फसल / मिट्टी की फोटो अपलोड करें (वैकल्पिक):')}
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--color-primary)',
              background: 'var(--color-background)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              color: 'var(--color-primary)',
              fontWeight: 600
            }}
          >
            <Upload size={16} />
            <span>
              {imageName
                ? imageName
                : t('Choose Leaf or Soil Image...', 'পাতা বা মাটির ছবি বাছুন...', 'पत्ती या मिट्टी की फोटो चुनें...')}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: '0.35rem'
            }}
          >
            {t('3. Additional Symptom Note (Optional):', '৩. অতিরিক্ত লক্ষণ বা নোট (ঐচ্ছিক):', '3. अतिरिक्त लक्षण विवरण (वैकल्पिक):')}
          </label>
          <input
            type="text"
            value={symptomNote}
            onChange={(e) => setSymptomNote(e.target.value)}
            placeholder={t(
              'e.g., Noticed after 3 days of heavy rain...',
              'যেমন: ৩ দিন ভারী বৃষ্টির পর দেখা গেছে...',
              'जैसे: 3 दिन की तेज बारिश के बाद दिखाई दिया...'
            )}
            className="form-control"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={handleRunDiagnosis}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? <RefreshCw size={16} /> : <Sparkles size={16} />}
          <span>
            {loading
              ? t('Running Smart Diagnosis...', 'নির্ণয় চলছে...', 'स्मार्ट निदान चल रहा है...')
              : t('Diagnose with Kisan Sahayak AI', 'কিষাণ সহায়ক এআই দিয়ে নির্ণয় করুন', 'किसान सहायक एआई से निदान करें')}
          </span>
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(198, 40, 40, 0.08)',
            border: '1px solid rgba(198, 40, 40, 0.3)',
            color: 'var(--color-danger)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1.1rem',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '1.02rem', color: 'var(--color-primary)' }}>
              {result.observedCondition}
            </strong>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {t('Severity:', 'তীব্রতা:', 'गंभीरता:')} {result.severity}
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', marginBottom: '0.9rem', lineHeight: 1.55 }}>
            {result.diagnosisSummary}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginBottom: '0.85rem'
            }}
          >
            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)'
              }}
            >
              <strong style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--color-text)' }}>
                {t('Likely Causes', 'সম্ভাব্য কারণসমূহ', 'संभावित कारण')}
              </strong>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.81rem', color: 'var(--color-text-muted)' }}>
                {(result.likelyCauses || []).map((c, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{c}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)'
              }}
            >
              <strong style={{ display: 'block', fontSize: '0.82rem', marginBottom: '0.4rem', color: 'var(--color-primary)' }}>
                {t('Recommended Field Actions', 'প্রস্তাবিত পদক্ষেপ', 'अनुशंसित कदम')}
              </strong>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.81rem', color: 'var(--color-text)' }}>
                {(result.recommendedSteps || []).map((s, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {result.disclaimer && (
            <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{result.disclaimer}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
