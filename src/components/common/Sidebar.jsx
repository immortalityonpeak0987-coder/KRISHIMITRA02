import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  CloudSun,
  Repeat,
  Activity,
  FileText,
  AlertTriangle,
  X,
  Sun,
  Moon,
  Globe,
  Settings as SettingsIcon,
  Leaf,
} from 'lucide-react';

const FARM_NAV_ITEMS = [
  {
    path: '/app/overview',
    labelEn: 'My Farm',
    labelBn: 'আমার খামার',
    subEn: 'Weather, soil & next steps',
    subBn: 'আবহাওয়া, মাটি ও পরবর্তী কাজ',
    icon: LayoutDashboard
  },
  {
    path: '/app/farms',
    labelEn: 'My Plots',
    labelBn: 'আমার জমি',
    subEn: 'Map & plot details',
    subBn: 'মানচিত্র ও জমির বিবরণ',
    icon: MapPin
  },
  {
    path: '/app/climate',
    labelEn: 'Weather & Alerts',
    labelBn: 'আবহাওয়া ও সতর্কবার্তা',
    subEn: 'Rain, heat & waterlogging',
    subBn: 'বৃষ্টি, তাপ ও জলজমা',
    icon: CloudSun
  },
  {
    path: '/app/crop-planner',
    labelEn: 'Crop Planner',
    labelBn: 'ফসল পরিকল্পনা',
    subEn: 'What to grow next season',
    subBn: 'পরবর্তী মৌসুমে কী চাষ করবেন',
    icon: Repeat
  },
  {
    path: '/app/reports',
    labelEn: 'Reports',
    labelBn: 'প্রতিবেদন',
    subEn: 'Print summary & guidance',
    subBn: 'ছাপা সারাংশ ও পরামর্শ',
    icon: FileText
  }
];

const TOOLS_NAV_ITEMS = [
  {
    path: '/app/risk',
    labelEn: 'Soil Test & Risk',
    labelBn: 'মাটি পরীক্ষা ও ঝুঁকি',
    subEn: 'Soil pH, salinity & hazard screening',
    subBn: 'মাটির pH, লবণাক্ততা ও ঝুঁকি যাচাই',
    icon: AlertTriangle
  },
  {
    path: '/app/recovery',
    labelEn: 'Farm Recovery',
    labelBn: 'খামার পুনরুদ্ধার',
    subEn: 'Checklist & field notes',
    subBn: 'চেকলিস্ট ও খেতের নোট',
    icon: Activity
  },
  {
    path: '/app/satellite',
    labelEn: 'Crop Health Map',
    labelBn: 'ফসলের স্বাস্থ্য মানচিত্র',
    subEn: 'Crop greenness & soil moisture',
    subBn: 'স্যাটেলাইট সবুজতা ও আর্দ্রতা',
    icon: Leaf
  },
  {
    path: '/app/research',
    labelEn: 'Data Sources',
    labelBn: 'তথ্যসূত্র',
    subEn: 'Weather & soil data sources',
    subBn: 'আবহাওয়া ও মাটির তথ্যের উৎস',
    icon: Globe
  },
  {
    path: '/app/settings',
    labelEn: 'Settings',
    labelBn: 'সেটিংস',
    subEn: 'Units, language & theme',
    subBn: 'একক, ভাষা ও থিম',
    icon: SettingsIcon
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const {
    t,
    activeFarm,
    language,
    toggleLanguage,
    experienceMode,
    setExperienceMode,
  } = useFarm();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isFarmer = experienceMode === 'farmer';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(38, 51, 43, 0.35)',
            zIndex: 90,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      <aside
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - var(--navbar-height))',
          position: 'sticky',
          top: 'var(--navbar-height)',
          zIndex: 95,
          transition: 'transform var(--transition-normal)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
        className="sidebar-responsive no-print"
      >
        {/* Header */}
        <div
          style={{
            padding: '0.85rem 0.85rem 0.7rem',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '0.55rem' }}>
            <div className="flex items-center gap-2">
              <img
                src="/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png"
                alt="KRISHI-MITRA"
                style={{ height: '28px', width: 'auto', borderRadius: '6px', background: '#FFFFFF' }}
              />
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.06em'
                }}
              >
                {isFarmer ? t('FARMER WORKSPACE', 'কৃষক মোড') : t('FARM WORKSPACE', 'কৃষক মোড')}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{ color: 'var(--color-text-muted)' }}
              className="close-btn"
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Theme Toggle in Sidebar */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              padding: '0.38rem 0.4rem',
              borderRadius: '6px',
              fontSize: '0.73rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'var(--color-secondary)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            <span style={{ fontSize: '0.7rem' }}>{t('Theme', 'থিম')}</span>
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            style={{
              marginTop: '0.4rem',
              padding: '0.38rem 0.4rem',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}
          >
            <span style={{ fontSize: '0.7rem' }}>
              {language === 'en' ? 'EN / বাংলা / हिंदी' : language === 'bn' ? 'বাংলা / हिंदी / EN' : 'हिंदी / EN / বাংলা'}
            </span>
          </button>
        </div>

        {/* Navigation List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.65rem 0.6rem' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.5rem',
              paddingLeft: '0.6rem'
            }}
          >
            {t('Farm', 'খামার')}
          </div>
          {FARM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{ padding: '0.68rem 0.85rem' }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, lineHeight: 1.25 }}>
                  <div>{t(item.labelEn, item.labelBn)}</div>
                  {item.subEn && (
                    <div
                      style={{
                        fontSize: '0.67rem',
                        color: 'var(--color-text-muted)',
                        fontWeight: 400,
                        marginTop: '2px'
                      }}
                    >
                      {t(item.subEn, item.subBn)}
                    </div>
                  )}
                </div>
              </NavLink>
            );
          })}

          <div
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: '1rem',
              marginBottom: '0.5rem',
              paddingLeft: '0.6rem'
            }}
          >
            {t('Tools', 'সরঞ্জাম')}
          </div>
          {TOOLS_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{ padding: '0.68rem 0.85rem' }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, lineHeight: 1.25 }}>
                  <div>{t(item.labelEn, item.labelBn)}</div>
                  {item.subEn && (
                    <div
                      style={{
                        fontSize: '0.67rem',
                        color: 'var(--color-text-muted)',
                        fontWeight: 400,
                        marginTop: '2px'
                      }}
                    >
                      {t(item.subEn, item.subBn)}
                    </div>
                  )}
                </div>
              </NavLink>
            );
          })}

          <div
            style={{
              marginTop: '0.65rem',
              paddingTop: '0.65rem',
              borderTop: '1px dashed var(--color-border)'
            }}
          >
            <NavLink
              to="/app/register-farm"
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={{ fontSize: '0.8rem' }}
            >
              <PlusCircle size={16} style={{ color: 'var(--color-primary)' }} />
              <span>{t('+ Add New Farm Plot', '+ নতুন খামার যোগ করুন')}</span>
            </NavLink>
          </div>
        </div>

        {/* Active Farm Footer */}
        {activeFarm && (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--color-secondary)',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.74rem',
              color: 'var(--color-primary)'
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '0.2rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: 'var(--color-primary)' }}>
                {t('ACTIVE PLOT', 'সক্রিয় খামার')}
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--color-text)', fontWeight: 600 }}>
              {activeFarm.district}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {activeFarm.area} {activeFarm.areaUnit}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
