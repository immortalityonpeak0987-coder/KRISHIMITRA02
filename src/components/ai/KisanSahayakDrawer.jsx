import React, { useState } from 'react';
import { MessageSquare, Sparkles, X, Send, Trash2, AlertTriangle } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { aiService, buildFarmContextPayload } from '../../services/aiService';

const QUICK_QUESTIONS = [
  {
    en: 'What should I do on my farm this week?',
    bn: 'এই সপ্তাহে আমার জমিতে কী করণীয়?',
    hi: 'इस सप्ताह मुझे अपने खेत में क्या करना चाहिए?'
  },
  {
    en: 'How can I protect my crop from waterlogging or salinity?',
    bn: 'জলমগ্নতা বা লবণাক্ততা থেকে ফসল কীভাবে রক্ষা করব?',
    hi: 'जलभराव या लवणता से अपनी फसल को कैसे बचाएं?'
  },
  {
    en: 'Which crop variety is best for my next sowing season?',
    bn: 'পরবর্তী মৌসুমে বপনের জন্য কোন ফসলের জাত সবচেয়ে ভালো?',
    hi: 'अगली बुवाई के मौसम के लिए कौन सी फसल की किस्म सबसे अच्छी है?'
  }
];

export default function KisanSahayakDrawer() {
  const { activeFarm, language, setLanguage, t } = useFarm();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (questionText) => {
    const text = (questionText ?? input).trim();
    if (!text || loading) return;

    const nextHistory = [...messages, { role: 'user', text }];
    setMessages(nextHistory);
    if (!questionText) setInput('');
    setLoading(true);
    setError('');

    try {
      const farmContext = buildFarmContextPayload(activeFarm);
      const res = await aiService.chatWithKisanSahayak({
        farmContext,
        message: text,
        history: nextHistory,
        language
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.reply || 'No response received.' }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to reach Kisan Sahayak AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Kisan Sahayak AI Assistant"
        className="no-print"
        style={{
          position: 'fixed',
          right: '1.35rem',
          bottom: '1.35rem',
          zIndex: 990,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.55rem',
          padding: '0.75rem 1.15rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary)',
          color: '#FFFFFF',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: 'var(--shadow-lg)',
          fontWeight: 700,
          fontSize: '0.88rem',
          cursor: 'pointer'
        }}
      >
        <Sparkles size={17} />
        <span>{t('Kisan Sahayak AI', 'কিষাণ সহায়ক এআই', 'किसान सहायक एआई')}</span>
      </button>

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.35)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(430px, 100vw)',
              height: '100%',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem 1.15rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={19} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <strong style={{ fontSize: '0.98rem', display: 'block', lineHeight: 1.1 }}>
                    {t('Kisan Sahayak AI', 'কিষাণ সহায়ক এআই', 'किसान सहायक एआई')}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {activeFarm ? `${activeFarm.name} · ${activeFarm.district}` : 'KRISHI-MITRA'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1"
                  style={{
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '2px'
                  }}
                >
                  {[
                    { id: 'en', label: 'EN' },
                    { id: 'bn', label: 'বাং' },
                    { id: 'hi', label: 'हिं' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      style={{
                        padding: '0.18rem 0.45rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        background: language === l.id ? 'var(--color-primary)' : 'transparent',
                        color: language === l.id ? '#FFFFFF' : 'var(--color-text-muted)'
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setError('');
                    }}
                    aria-label="Clear chat"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Kisan Sahayak drawer"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.15rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.45rem' }}>
                  {t('Quick Questions:', 'দ্রুত প্রশ্ন:', 'त्वरित प्रश्न:')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {QUICK_QUESTIONS.map((q, idx) => {
                    const label = language === 'bn' ? q.bn : language === 'hi' ? q.hi : q.en;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(label)}
                        disabled={loading}
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '88%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-md)',
                      background: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-background)',
                      color: m.role === 'user' ? '#FFFFFF' : 'var(--color-text)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--color-border)',
                      fontSize: '0.84rem',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '0.5rem 0' }}>
                  {t('Kisan Sahayak is thinking...', 'কিষাণ সহায়ক উত্তর তৈরি করছে...', 'किसान सहायक उत्तर तैयार कर रहा है...')}
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(198, 40, 40, 0.08)',
                    border: '1px solid rgba(198, 40, 40, 0.3)',
                    color: 'var(--color-danger)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <AlertTriangle size={15} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                padding: '0.85rem 1.15rem',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: '0.5rem'
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t(
                  'Ask about weather, soil, or crops...',
                  'আবহাওয়া, মাটি বা ফসল নিয়ে প্রশ্ন করুন...',
                  'मौसम, मिट्टी या फसल के बारे में पूछें...'
                )}
                className="form-control"
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn btn-primary"
                aria-label="Send question"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
