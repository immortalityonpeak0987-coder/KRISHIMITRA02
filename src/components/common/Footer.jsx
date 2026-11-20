import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, Globe } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { BRAND } from '../../config/brand';

export default function Footer() {
  const { t } = useFarm();

  return (
    <footer
      className="no-print"
      style={{
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-muted)',
        borderTop: '1px solid var(--color-border)',
        padding: '3rem 0 1.75rem',
        fontSize: '0.88rem'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem'
          }}
        >
          {/* Brand Col */}
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
              <img
                src="/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png"
                alt="KRISHI-MITRA"
                style={{ height: '44px', width: 'auto', borderRadius: '6px', background: '#FFFFFF' }}
              />
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    display: 'block',
                    lineHeight: 1.1
                  }}
                >
                  KRISHI<span style={{ color: 'var(--color-primary)' }}>MITRA</span>
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}
                >
                  Smart Agriculture
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.84rem', lineHeight: 1.65 }}>
              {t(
                'Smart Agriculture & Allied Sector Monitoring System for Indian farmers, rural communities, and agricultural professionals.',
                'ভারতীয় কৃষক, গ্রামীয় সম্প্রদায় ও কৃষি পেশাজীবীদের জন্য স্মার্ট কৃষি ও সংশ্লিষ্ট খাত নিরীক্ষণ ব্যবস্থা।'
              )}
            </p>
            <div
              style={{
                marginTop: '0.85rem',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Seva First Innovation Challenge – Eastern Region
            </div>
            <div
              style={{
                marginTop: '0.4rem',
                color: 'var(--color-text-muted)',
                fontSize: '0.72rem',
                lineHeight: 1.4
              }}
            >
              {BRAND.disclaimer}
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4
              style={{
                color: 'var(--color-text)',
                fontSize: '0.92rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '0.45rem'
              }}
            >
              {t('Core Features', 'প্রধান বৈশিষ্ট্যসমূহ')}
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <li>
                <Link to="/app/overview" style={{ color: 'var(--color-text)', fontSize: '0.84rem' }}>
                  {t('My Farm Dashboard', 'খামার ড্যাশবোর্ড')}
                </Link>
              </li>
              <li>
                <Link to="/app/climate" style={{ color: 'var(--color-text)', fontSize: '0.84rem' }}>
                  {t('Weather & Alerts', 'আবহাওয়া ও সতর্কবার্তা')}
                </Link>
              </li>
              <li>
                <Link to="/app/crop-planner" style={{ color: 'var(--color-text)', fontSize: '0.84rem' }}>
                  {t('Crop Planner', 'ফসল পরিকল্পনা')}
                </Link>
              </li>
              <li>
                <Link to="/app/risk" style={{ color: 'var(--color-text)', fontSize: '0.84rem' }}>
                  {t('Soil Test & Risk', 'মাটি পরীক্ষা ও ঝুঁকি')}
                </Link>
              </li>
              <li>
                <Link to="/app/reports" style={{ color: 'var(--color-text)', fontSize: '0.84rem' }}>
                  {t('Reports', 'প্রতিবেদন')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h4
              style={{
                color: 'var(--color-text)',
                fontSize: '0.92rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '0.45rem'
              }}
            >
              {t('Data Sources', 'তথ্যসূত্র')}
            </h4>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Open weather and satellite data used for regional conditions, soil moisture, and crop health context. These regional estimates do not replace plot-level laboratory soil testing.
            </p>
            <div
              className="flex items-center gap-2"
              style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-primary)' }}
            >
              <Leaf size={14} />
              <span>Agricultural decision support</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)'
          }}
        >
          <div>
            © 2026 KRISHI-MITRA • Built by Team INOVATRIX.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" style={{ color: 'var(--color-primary)' }}>
              {t('About Project', 'প্রকল্প সম্পর্কে')}
            </Link>
            <Link to="/app/research" style={{ color: 'var(--color-primary)' }}>
              {t('Data Sources', 'তথ্যসূত্র')}
            </Link>
            <Link to="/app/reports" style={{ color: 'var(--color-primary)' }}>
              {t('Printable Report', 'প্রিন্টযোগ্য প্রতিবেদন')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
