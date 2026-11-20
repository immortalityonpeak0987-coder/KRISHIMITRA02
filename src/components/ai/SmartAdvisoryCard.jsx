import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { aiService, buildFarmContextPayload } from '../../services/aiService';

export default function SmartAdvisoryCard({
  pageType = 'overview',
  weatherSummary = {},
  soilSummary = {},
  satelliteSummary = {}
}) {
  const { activeFarm, language, setLanguage, t } = useFarm();
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAdvisory(null);
    setError('');
  }, [activeFarm?.id]);

  const handleGenerate = async (targetLang = language) => {
    if (!activeFarm) return;
    setLoading(true);
    setError('');
    try {
      const farmContext = buildFarmContextPayload(activeFarm, {
        weather: weatherSummary,
        soil: soilSummary,
        satellite: satelliteSummary
      });
      const res = await aiService.generateSmartAdvisory({
        farmContext,
        pageType,
        language: targetLang
      });
      setAdvisory(res);
    } catch (err) {
      setError(err.message || 'Could not generate smart farm advisory.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div
        className="flex items-center justify-between"
        style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: advisory || error ? '1rem' : 0 }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              background: 'var(--color-success-bg)',
              border: '1px solid rgba(46, 125, 50, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                {t(
                  'Kisan Sahayak Smart Farm Advisory',
                  'কিষাণ সহায়ক স্মার্ট কৃষি পরামর্শ',
                  'किसान सहायक स्मार्ट कृषि सलाह'
                )}
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--color-text-muted)'
                }}
              >
                · {activeFarm?.name} · {activeFarm?.currentCrop}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              {t(
                'Get a tailored 3-point field action plan based on live plot weather, soil moisture, and crop stage.',
                'আপনার জমির আবহাওয়া, মাটির আর্দ্রতা ও ফসলের অবস্থার ভিত্তিতে ৩-দফা পরামর্শ পান।',
                'अपने खेत के मौसम, मिट्टी की नमी और फसल की स्थिति के आधार पर 3-सूत्रीय कार्य योजना प्राप्त करें।'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <div
            className="flex items-center gap-1"
            style={{
              background: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.2rem'
            }}
          >
            {[
              { id: 'en', label: 'EN' },
              { id: 'bn', label: 'বাংলা' },
              { id: 'hi', label: 'हिंदी' }
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  setLanguage(lang.id);
                  if (advisory) handleGenerate(lang.id);
                }}
                style={{
                  padding: '0.22rem 0.55rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background: language === lang.id ? 'var(--color-primary)' : 'transparent',
                  color: language === lang.id ? '#FFFFFF' : 'var(--color-text-muted)'
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleGenerate(language)}
            disabled={loading}
            className="btn btn-sm btn-primary"
          >
            {loading ? <RefreshCw size={14} /> : <Sparkles size={14} />}
            <span>
              {loading
                ? t('Analyzing Plot...', 'বিশ্লেষণ চলছে...', 'विश्लेषण हो रहा है...')
                : advisory
                ? t('Refresh Advisory', 'পুনরায় তৈরি করুন', 'सलाह अपडेट करें')
                : t('Generate Smart Advisory', 'স্মার্ট পরামর্শ পান', 'स्मার্ট सलाह प्राप्त करें')}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
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

      {advisory && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1rem'
          }}
        >
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
              {advisory.headline}
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', margin: 0, lineHeight: 1.55 }}>
              {advisory.summary}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.85rem',
              marginBottom: '0.85rem'
            }}
          >
            {(advisory.actions || []).map((act, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--color-text)' }}>
                    0{idx + 1}. {act.title}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                    {act.priority}
                  </span>
                </div>
                <p style={{ fontSize: '0.81rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {act.detail}
                </p>
              </div>
            ))}
          </div>

          {advisory.safetyNote && (
            <div
              className="flex items-center gap-2"
              style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}
            >
              <CheckCircle2 size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{advisory.safetyNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
