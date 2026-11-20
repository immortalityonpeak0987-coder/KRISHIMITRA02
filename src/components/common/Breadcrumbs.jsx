import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

const ROUTE_LABELS = {
  app: { en: 'Farm Portal', bn: 'কৃষক পোর্টাল' },
  overview: { en: 'My Farm', bn: 'আমার খামার' },
  farms: { en: 'My Plots', bn: 'আমার জমি' },
  'register-farm': { en: 'Add New Plot', bn: 'নতুন খামার যোগ করুন' },
  climate: { en: 'Weather & Alerts', bn: 'আবহাওয়া ও সতর্কবার্তা' },
  satellite: { en: 'Crop Health Map', bn: 'ফলের স্বাস্থ্য মানচিত্র' },
  risk: { en: 'Soil Test & Risk', bn: 'মাটি পরীক্ষা ও ঝুঁকি' },
  'crop-planner': { en: 'Crop Planner', bn: 'ফসল পরিকল্পক' },
  recovery: { en: 'Farm Recovery', bn: 'খামার পুনরুদ্ধার' },
  reports: { en: 'Reports', bn: 'প্রতিবেদন' },
  research: { en: 'Data Sources', bn: 'তথ্যসূত্র' },
  settings: { en: 'Settings', bn: 'সেটিংস' }
};

export default function Breadcrumbs() {
  const location = useLocation();
  const { t } = useFarm();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="no-print"
      style={{
        padding: '0.6rem 0',
        marginBottom: '1.1rem',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}
      >
        <Link
          to="/"
          className="flex items-center gap-1"
          style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}
        >
          <Home size={13} style={{ color: 'var(--color-primary)' }} />
          <span>{t('Home', 'হোম')}</span>
        </Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const entry = ROUTE_LABELS[value];
          const label = entry ? t(entry.en, entry.bn) : value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <React.Fragment key={to}>
              <ChevronRight size={13} style={{ color: 'rgba(120, 132, 123, 0.5)' }} />
              {isLast ? (
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{label}</span>
              ) : (
                <Link to={to} style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
