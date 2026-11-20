import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CloudSun,
  Repeat,
  MapPin,
  FileText,
  AlertTriangle,
  Leaf,
  Compass,
  Sprout,
  Droplets,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import DemoBadge from '../components/common/DemoBadge';

export default function HomePage() {
  const { farms, activeFarm, switchFarm, t, formatArea } = useFarm();
  const navigate = useNavigate();

  const handleInspectFarm = (farmId) => {
    switchFarm(farmId);
    navigate('/app/overview');
  };

  return (
    <div style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      {/* HERO SECTION */}
      <section
        style={{
          padding: '4rem 0 5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '2.5rem',
              alignItems: 'center'
            }}
          >
            {/* Left Content */}
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <img
                  src="/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png"
                  alt="KRISHI-MITRA — Smart Kisan • Samriddh Bharat"
                  style={{
                    height: '120px',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    padding: '0.35rem 0.75rem',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                />
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  background: 'var(--color-success-bg)',
                  border: '1px solid rgba(46, 125, 50, 0.3)',
                  padding: '0.42rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem'
                }}
              >
                <Sprout size={14} style={{ color: 'var(--color-primary)' }} />
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    letterSpacing: '0.06em'
                  }}
                >
                  {t('SEVA FIRST INNOVATION CHALLENGE – EASTERN REGION', 'সেবা ফার্স্ট ইনোভেশন চ্যালেঞ্জ – পূর্বাঞ্চল')}
                </span>
              </div>

              <h1
                style={{
                  color: 'var(--color-text)',
                  fontSize: 'clamp(2.25rem, 4vw, 3.35rem)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  marginBottom: '1.15rem',
                  letterSpacing: '-0.025em'
                }}
              >
                KRISHI<span style={{ color: 'var(--color-primary)' }}>MITRA</span>
                {' '}
                <span style={{ color: 'var(--color-primary)' }}>
                  {t('Smart Agriculture', 'স্মার্ট কৃষি')}
                </span>
              </h1>

              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '1.06rem',
                  lineHeight: 1.65,
                  marginBottom: '1.85rem',
                  maxWidth: '60ch'
                }}
              >
                {t(
                  'Simple weather, soil moisture, crop health, and recovery guidance for Indian farmers and rural communities. KRISHI-MITRA helps you make confident farming decisions with clear, plain-language information.',
                  'ভಾರತীয় কৃষক ও গ্রামীয় সম্প্রদায়ের জন্য সহজ আবহাওয়া, মাটির আর্দ্রতা, ফলের স্বাস্থ্য ও পুনরুদ্ধার নির্দেশিকা। KRISHI-MITRA স্পষ্ট ও সহজ ভাষায় আপনাকে খামার সিদ্ধান্ত নিতে সাহায্য করে।'
                )}
              </p>

              <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                <Link to="/app/overview" className="btn btn-lg btn-primary">
                  <Compass size={18} />
                  <span>{t('Open My Farm Dashboard', 'আমার খামার ড্যাশবোর্ড খুলুন')}</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/app/register-farm"
                  className="btn btn-lg btn-secondary"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>{t('+ Register Your Farm', '+ আপনার খামার নিবন্ধন করুন')}</span>
                </Link>
              </div>
            </div>

            {/* Right: Summary Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-border)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between"
                  style={{
                    paddingBottom: '1rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png"
                      alt="KRISHI-MITRA"
                      style={{
                        height: '48px',
                        width: 'auto',
                        borderRadius: '10px',
                        background: '#FFFFFF',
                        padding: '2px',
                        border: '1px solid var(--color-border)'
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-primary)',
                          letterSpacing: '0.06em'
                        }}
                      >
                        ACTIVE PLOT SNAPSHOT
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        {activeFarm ? activeFarm.name : 'No Active Farm'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>
                        {activeFarm
                          ? `${activeFarm.district} (${Number(activeFarm.latitude).toFixed(2)}°N, ${Number(activeFarm.longitude).toFixed(2)}°E)`
                          : 'Register a farm to see your plot details'}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-success">SAMPLE DATA</span>
                </div>

                {/* 3 Simple Status Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div
                    style={{
                      background: 'var(--color-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {t('Weather', 'আবহাওয়া')}
                    </div>
                    <div
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {activeFarm ? '24.8°C' : '--°C'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      {t('Check Weather & Alerts', 'আবহাওয়া ও সতর্কবার্তা দেখুন')}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--color-success-bg)',
                      border: '1px solid rgba(46, 125, 50, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {t('Soil Moisture', 'মাটির আর্দ্রতা')}
                    </div>
                    <div
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {activeFarm ? t('Good', 'ভালো') : '--'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      {t('Check Soil Test', 'মাটি পরীক্ষা দেখুন')}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(220, 201, 163, 0.15)',
                      border: '1px solid var(--color-accent)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {t('Crop Health', 'ফলের স্বাস্থ্য')}
                    </div>
                    <div
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    >
                      {activeFarm ? t('Healthy', 'সুস্থ') : '--'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      {t('Check Crop Map', 'ফলের মানচিত্র দেখুন')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between" style={{ fontSize: '0.76rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {t('Sample data shown. Register your farm for personalized information.', 'নমুনা তথ্য দেখা যাচ্ছে। আপনার খামার নিবন্ধন করুন ব্যক্তিগত তথ্যের জন্য।')}
                  </span>
                  <Link
                    to="/app/register-farm"
                    style={{ color: 'var(--color-primary)', fontWeight: 700 }}
                  >
                    {t('Register Now →', 'এখন নিবন্ধন করুন →')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              {t('HOW KRISHI-MITRA WORKS', 'KRISHI-MITRA কীভাবে কাজ করে')}
            </span>
            <h2 style={{ fontSize: '2.1rem', marginTop: '0.4rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>
              {t('Simple Steps for Better Farming', 'উন্নত চাষের সহজ ধাপসমূহ')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.98rem' }}>
              {t('Register your farm, check weather and soil, plan your crops, and track recovery — all in one simple app.', 'আপনার খামার নিবন্ধন করুন, আবহাওয়া ও মাটি পরীক্ষা করুন, ফসল পরিকল্পনা করুন এবং পুনরুদ্ধার ট্রैक করুন – সব একే জায়গায়।')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="card" style={{ borderTop: '3px solid var(--color-primary)' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-success-bg)',
                  color: 'var(--color-primary)',
                  marginBottom: '1rem'
                }}
              >
                <MapPin size={24} />
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.06em',
                  marginBottom: '0.3rem'
                }}
              >
                STEP 01 • REGISTER YOUR FARM
              </div>
              <h3 style={{ fontSize: '1.22rem', marginBottom: '0.55rem', color: 'var(--color-text)' }}>
                Add Your Farm Plot
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Tell us your farm location, area, and current crop. Your plot stays private to you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ borderTop: '3px solid var(--color-primary)' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-success-bg)',
                  color: 'var(--color-primary)',
                  marginBottom: '1rem'
                }}
              >
                <Droplets size={24} />
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.06em',
                  marginBottom: '0.3rem'
                }}
              >
                STEP 02 • CHECK WEATHER & SOIL
              </div>
              <h3 style={{ fontSize: '1.22rem', marginBottom: '0.55rem', color: 'var(--color-text)' }}>
                Get Simple Guidance
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                See rainfall, temperature, soil moisture, and seasonal advisories in plain language.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ borderTop: '3px solid var(--color-primary)' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-success-bg)',
                  color: 'var(--color-primary)',
                  marginBottom: '1rem'
                }}
              >
                <Repeat size={24} />
              </div>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.06em',
                  marginBottom: '0.3rem'
                }}
              >
                STEP 03 • PLAN & TRACK
              </div>
              <h3 style={{ fontSize: '1.22rem', marginBottom: '0.55rem', color: 'var(--color-text)' }}>
                Plan Crops & Track Recovery
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Choose what to grow next season and log field observations after rain or hazards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO FARMS */}
      {farms.length > 0 && (
        <section style={{ backgroundColor: 'var(--color-secondary)', padding: '4rem 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                {t('SAMPLE FARM PLOTS', 'নমুনা খামার')}
              </span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.4rem', color: 'var(--color-text)' }}>
                {t('Explore Sample Farm Plots', 'নমুনা খামার দেখুন')}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {farms.map((farm) => {
                const isCurrent = activeFarm?.id === farm.id;
                return (
                  <button
                    key={farm.id}
                    onClick={() => handleInspectFarm(farm.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      background: isCurrent ? 'var(--color-success-bg)' : 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: isCurrent
                        ? '1px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--color-text)'
                    }}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.25rem' }}>
                      <strong style={{ color: 'var(--color-text)', fontSize: '0.92rem' }}>
                        {farm.name}
                      </strong>
                      <DemoBadge label={isCurrent ? 'ACTIVE PLOT' : 'SAMPLE'} isLive={isCurrent} />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {farm.district} • {farm.agroClimaticZone || 'West Bengal'} • {formatArea(farm)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-primary)',
                        marginTop: '0.25rem'
                      }}
                    >
                      {t('Standing crop:', ' দাঁড়ানো ফসল:')} {farm.currentCrop} • {t('Soil:', 'মাটি:')} {farm.soilType}
                    </div>
                  </button>
                );
              })}
              <div
                className="flex items-center justify-between"
                style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}
              >
                <Link to="/app/register-farm" className="btn btn-sm btn-primary">
                  + {t('Register Your Own Plot', 'আপনার নিজস্ব খামার নিবন্ধন করুন')}
                </Link>
                <Link to="/app/farms" className="btn btn-sm btn-outline">
                  {t('Manage All Plots →', 'সব খামার ব্যবস্থাপনা করুন →')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ALLIED SECTORS */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              {t('AGRICULTURE & ALLIED SECTORS', 'কৃষি ও অনুসঙ্গি খাত')}
            </span>
            <h2 style={{ fontSize: '2rem', marginTop: '0.4rem', marginBottom: '0.75rem', color: 'var(--color-text)' }}>
              {t('Positioned for Indian Agriculture', 'ভারতীয় কৃষির জন্য প্রস্তুত')}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.98rem' }}>
              {t('This system focuses on weather, soil, crop planning, and farm recovery for crop farms. Allied sectors such as livestock, fisheries, poultry, and dairy are part of our future scope.', 'এই ব্যবস্থাটি ফসল চাষের জন্য আবহাওয়া, মাটি, ফসল পরিকল্পনা ও খামার পুনরুদ্ধারের ওপর কেন্দ্রীভূত। পশুধন, মৎস্য, মুরগি ও ডেইরি আমাদের ভবিষ্যত পরিকল্পনার অংশ।')}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('Smart Irrigation', 'স্মার্ট সেচ'), icon: Droplets },
              { label: t('Crop Health', 'ফলের স্বাস্থ্য'), icon: Leaf },
              { label: t('Weather Alerts', 'আবহাওয়া সতর্কতা'), icon: CloudSun },
              { label: t('Soil Monitoring', 'মাটি নিরীক্ষণ'), icon: AlertTriangle },
              { label: t('Crop Planning', 'ফসল পরিকল্পনা'), icon: Repeat },
              { label: t('Farm Recovery', 'খামার পুনরুদ্ধার'), icon: Activity },
            ].map((item, idx) => (
              <div
                key={idx}
                className="card"
                style={{ textAlign: 'center', padding: '1.5rem 1rem' }}
              >
                <item.icon size={28} style={{ color: 'var(--color-primary)', marginBottom: '0.75rem', display: 'block' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
