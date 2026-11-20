import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Globe, Scale, Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
  const {
    activeFarm,
    unitPreference,
    setUnitPreference,
    language,
    setLanguage,
    t
  } = useFarm();
  const { theme, setTheme, toggleTheme } = useTheme();

  const [farmerProfile, setFarmerProfile] = useState({
    name: activeFarm?.farmerName || '',
    phone: '',
    village: activeFarm?.village || '',
    district: activeFarm?.district || ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetData = () => {
    localStorage.removeItem('krishi_mitra_registered_farms_v1');
    localStorage.removeItem('krishi-mitra_registered_farms_v1');
    localStorage.removeItem('krishi_mitra_active_farm_id_v1');
    localStorage.removeItem('krishi-mitra_active_farm_id_v1');
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.35rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          {t('Settings', 'সেটিংস')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
          {t('Configure measurement units, language, theme, and your farmer profile.', 'পরিমাপ একক, ভাষা, থিম ও আপনার কৃষক প্রোফাইল সাজান।')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* 1. Theme */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {theme === 'dark' ? <Sun size={20} style={{ color: '#B07525' }} /> : <Moon size={20} style={{ color: 'var(--color-primary)' }} />}
              <span>{t('Appearance / Theme', 'দৃশ্যমানতা / থিম')}</span>
            </h3>
            <span className="badge badge-success">{theme.toUpperCase()}</span>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {t('Choose light or dark mode. Your choice is saved and remembered across visits.', 'হালকা বা গাঢ় মোড বেছে নিন। আপনার পছন্দ সংরক্ষিত হয় এবং পরবর্তী ভিজিটে মনে রাখা হয়।')}
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: theme === 'light' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: theme === 'light' ? 'var(--color-success-bg)' : 'var(--color-surface)',
                textAlign: 'left',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                <Moon size={16} style={{ color: 'var(--color-primary)', marginRight: '0.5rem' }} />
                <strong style={{ color: 'var(--color-text)' }}>{t('Light Mode', 'আলোকিত মোড')}</strong>
                {theme === 'light' && <span className="badge badge-success">Active</span>}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {t('Clean off-white background', 'পরিষ্কার অফ-হোয়াইট ব্যাকগ্রাউন্ড')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: theme === 'dark' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: theme === 'dark' ? 'var(--color-success-bg)' : 'var(--color-surface)',
                textAlign: 'left',
                cursor: 'pointer',
                flex: 1
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                <Sun size={16} style={{ color: '#B07525', marginRight: '0.5rem' }} />
                <strong style={{ color: 'var(--color-text)' }}>{t('Dark Mode', 'অন্ধকার মোড')}</strong>
                {theme === 'dark' && <span className="badge badge-success">Active</span>}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {t('Dim background for night use', 'রাতের ব্যবহারের জন্য ম্লান ব্যাকগ্রাউন্ড')}
              </span>
            </button>
          </div>
        </div>

        {/* 2. Measurement Units Preference */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Scale size={20} style={{ color: 'var(--color-primary)' }} />
              <span>{t('Farm Area Unit Preference', 'জমির পরিমাপ একক')}</span>
            </h3>
            <span className="badge badge-success">LIVE UNIT CONVERSION</span>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {t('Select the primary land measurement unit displayed across the app.', 'অ্যাপ জুড়ে প্রদর্শিত প্রাথমিক জমি পরিমাপ একক বেছে নিন।')}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem'
            }}
          >
            {[
              {
                id: 'Bigha',
                label: 'Bigha (বিঘা)',
                desc: 'West Bengal Standard (1 Bigha ≈ 0.3306 Acre / 1,338 m²)'
              },
              {
                id: 'Acre',
                label: 'Acre (একর)',
                desc: 'National Standard (1 Acre ≈ 3.025 Bigha)'
              },
              {
                id: 'Hectare',
                label: 'Hectare (হেক্টর)',
                desc: 'Scientific Metric Standard (1 Hectare ≈ 7.475 Bigha)'
              }
            ].map((unit) => {
              const selected = unitPreference === unit.id;
              return (
                <label
                  key={unit.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: selected ? 'var(--color-success-bg)' : 'var(--color-surface)',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: '0.35rem' }}
                  >
                    <strong style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>
                      {unit.label}
                    </strong>
                    <input
                      type="radio"
                      name="unitPref"
                      checked={selected}
                      onChange={() => setUnitPreference(unit.id)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.45
                    }}
                  >
                    {unit.desc}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. Language Selection */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Globe size={20} style={{ color: 'var(--color-primary)' }} />
              <span>{t('Language / Interface', 'ভাষা / ইন্টারফেস', 'भाषा / इंटरफ़ेस')}</span>
            </h3>
            <span className="badge badge-success">EN / বাংলা / हिंदी</span>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {t(
              'Switch between English, Bengali, and Hindi for interface labels and Kisan Sahayak Smart AI advisories.',
              'যেকোনো সময় ইংরেজি, বাংলা ও হিন্দির মধ্যে বদল করুন।',
              'इंटरफ़ेस और किसान सहायक स्मार्ट सलाह के लिए अंग्रेजी, बंगाली और हिंदी के बीच स्विच करें।'
            )}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1rem'
            }}
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: language === 'en' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: language === 'en' ? 'var(--color-success-bg)' : 'var(--color-surface)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                <strong style={{ color: 'var(--color-text)' }}>English (Default)</strong>
                {language === 'en' && <span className="badge badge-success">Active</span>}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {t('Clear agricultural terminology in English.', 'ইংরেজিতে পরিষ্কার কৃষি শব্দ।', 'अंग्रेजी में स्पष्ट कृषि शब्दावली।')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('bn')}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: language === 'bn' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: language === 'bn' ? 'var(--color-success-bg)' : 'var(--color-surface)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                <strong style={{ color: 'var(--color-text)' }}>বাংলা (Bengali)</strong>
                {language === 'bn' && <span className="badge badge-success">সক্রিয়</span>}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {t('Bengali navigation and Kisan Sahayak advisories for West Bengal farmers.', 'বাংলা নেভিগেশন ও শিরোনাম পশ্চিমবঙ্গের কৃষকদের জন্য।', 'पश्चिम बंगाल के किसानों के लिए बंगाली भाषा।')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('hi')}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: language === 'hi' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: language === 'hi' ? 'var(--color-success-bg)' : 'var(--color-surface)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: '0.35rem' }}>
                <strong style={{ color: 'var(--color-text)' }}>हिंदी (Hindi)</strong>
                {language === 'hi' && <span className="badge badge-success">सक्रिय</span>}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {t('Hindi Smart AI farm advisories and Kisan Sahayak guidance.', 'হিন্দিতে স্মার্ট এআই কৃষি পরামর্শ ও কিষাণ সহায়ক।', 'हिंदी में स्मार्ट एआई कृषि सलाह और किसान सहायक मार्गदर्शन।')}
              </span>
            </button>
          </div>
        </div>

        {/* 4. Farmer Profile Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <User size={20} style={{ color: 'var(--color-primary)' }} />
              <span>{t('Farmer Contact & Village Record', 'কৃষক পরিচিতি ও গ্রামের রেকর্ড')}</span>
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
              {t('Operator Identity', 'অপারেটর পরিচয়')}
            </span>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="prof-name">
                  {t('Farmer / Operator Name', 'কৃষক / অপারেটরের নাম')}
                </label>
                <input
                  id="prof-name"
                  type="text"
                  className="form-input"
                  value={farmerProfile.name}
                  onChange={(e) => setFarmerProfile({ ...farmerProfile, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-phone">
                  {t('Contact Phone (Optional)', 'যোগাযোগ ফোন (ঐচ্ছিক)')}
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  className="form-input"
                  value={farmerProfile.phone}
                  onChange={(e) => setFarmerProfile({ ...farmerProfile, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="prof-village">
                  {t('Village', 'গ্রাম')}
                </label>
                <input
                  id="prof-village"
                  type="text"
                  className="form-input"
                  value={farmerProfile.village}
                  onChange={(e) => setFarmerProfile({ ...farmerProfile, village: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('District', 'জেলা')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={farmerProfile.district}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button type="submit" className="btn btn-sm btn-primary">
                {t('Save Profile', 'প্রোফাইল সেভ করুন')}
              </button>
              {saveSuccess && (
                <span
                  style={{
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                    fontSize: '0.84rem'
                  }}
                >
                  ✓ {t('Profile saved!', 'প্রোফাইল সেভ করা হল!')}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* 5. Data Management & Reset */}
        <div className="card" style={{ borderLeft: '4px solid #C62828' }}>
          <div
            className="flex items-center justify-between"
            style={{ flexWrap: 'wrap', gap: '1rem' }}
          >
            <div>
              <strong style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>
                {t('Local State & Cache Reset', 'স্থানীয় অবস্থা ও ক্যাশ রিসেট')}
              </strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                {t('Restore default sample plots and clear local storage.', 'ডিফল্ট নমুনা প্লট পুনরুদ্ধার করুন ও স্থানীয় সংগ্রহ পরিষ্কার করুন।')}
              </p>
            </div>
            {!resetConfirmOpen ? (
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="btn btn-sm btn-danger"
              >
                <TrashIcon size={14} />
                <span>{t('Reset Local Cache', 'স্থানীয় ক্যাশ রিসেট করুন')}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="btn btn-sm btn-danger"
                >
                  {t('Confirm Reset', 'রিসেট নিশ্চিত করুন')}
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(false)}
                  className="btn btn-sm btn-secondary"
                >
                  {t('Cancel', 'বাতিল করুন')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrashIcon(props) {
  return React.createElement('svg', { ...props, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, [
    React.createElement('polyline', { key: 'trash-lid', points: '3 6 5 6 21 6' }),
    React.createElement('path', { key: 'trash-bin', d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' })
  ]);
}
