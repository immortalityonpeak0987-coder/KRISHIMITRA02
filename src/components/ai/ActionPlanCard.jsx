import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { aiService, buildFarmContextPayload } from '../../services/aiService';

export default function ActionPlanCard({
  planType = 'crop-planner',
  scenarioParams = {}
}) {
  const { activeFarm, language, t } = useFarm();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPlan(null);
    setError('');
  }, [activeFarm?.id]);

  const handleGeneratePlan = async () => {
    if (!activeFarm) return;
    setLoading(true);
    setError('');
    try {
      const farmContext = buildFarmContextPayload(activeFarm);
      const res = await aiService.generateActionPlan({
        farmContext,
        planType,
        scenarioParams,
        language
      });
      setPlan(res);
    } catch (err) {
      setError(err.message || 'Failed to generate AI action plan.');
    } finally {
      setLoading(false);
    }
  };

  const isRecovery = planType === 'recovery';

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div
        className="flex items-center justify-between"
        style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: plan || error ? '1rem' : 0 }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
            {isRecovery
              ? t(
                  'Smart 14-Day Farm Recovery Playbook',
                  'স্মার্ট ১৪-দিনের খামার পুনরুদ্ধার পরিকল্পনা',
                  'स्मार्ट 14-दिवसीय खेत रिकवरी योजना'
                )
              : t(
                  'Smart What-If Sowing & Rotation Advisor',
                  'স্মার্ট বপন ও ফসল আবর্তন পরামর্শদাতা',
                  'स्मार्ट बुवाई और फसल चक्र सलाहकार'
                )}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            {isRecovery
              ? t(
                  'Generate a step-by-step post-hazard drainage, soil amendment, and catch-crop plan.',
                  'জলমগ্নতা বা লবণাক্ততার পর ধাপে ধাপে মাটি ও ফসল পুনরুদ্ধার পরিকল্পনা তৈরি করুন।',
                  'जलभराव या लवणता के बाद चरण-दर-चरण मिट्टी और फसल रिकवरी योजना बनाएं।'
                )
              : t(
                  'Synthesize an AI sowing schedule and variety recommendation for your current scenario.',
                  'আপনার বর্তমান আবহাওয়া পরিস্থিতির জন্য সঠিক বীজ ও বপন সূচি তৈরি করুন।',
                  'अपने वर्तमान मौसम परिदृश्य के लिए उपयुक्त किस्म और बुवाई समय-सारणी प्राप्त करें।'
                )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGeneratePlan}
          disabled={loading}
          className="btn btn-sm btn-primary"
        >
          {loading ? <RefreshCw size={14} /> : <Sparkles size={14} />}
          <span>
            {loading
              ? t('Generating Plan...', 'পরিকল্পনা তৈরি হচ্ছে...', 'योजना बन रही है...')
              : isRecovery
              ? t('Generate Recovery Plan', 'পুনরুদ্ধার পরিকল্পনা পান', 'रिकवरी योजना बनाएं')
              : t('Generate AI Sowing Plan', 'এআই বপন পরিকল্পনা পান', 'एआई बुवाई योजना बनाएं')}
          </span>
        </button>
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

      {plan && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.2rem' }}>
              {plan.planTitle}
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--color-text)', margin: 0, lineHeight: 1.55 }}>
              {plan.verdict}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '0.85rem',
              marginBottom: '0.85rem'
            }}
          >
            {(plan.steps || []).map((st, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                  {st.phase}
                </div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                  {st.action}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{st.benefit}</span>
              </div>
            ))}
          </div>

          {Array.isArray(plan.recommendedVarieties) && plan.recommendedVarieties.length > 0 && (
            <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--color-text)', flexWrap: 'wrap' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--color-primary)' }} />
              <strong>{t('Recommended Varieties:', 'প্রস্তাবিত জাত:', 'अनुशंसित किस्में:')}</strong>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {plan.recommendedVarieties.join(' · ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
