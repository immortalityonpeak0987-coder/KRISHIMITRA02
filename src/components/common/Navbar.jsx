import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Bell, Sun, Moon, CheckCircle, MapPin, ChevronDown, PlusCircle } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const {
    activeFarm,
    farms,
    switchFarm,
    notifications,
    dismissNotification,
    language,
    toggleLanguage,
    t,
    formatArea,
  } = useFarm();
  const { theme, toggleTheme } = useTheme();
  const [showFarmDropdown, setShowFarmDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const farmDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (farmDropdownRef.current && !farmDropdownRef.current.contains(event.target)) {
        setShowFarmDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const isDashboardView = location.pathname.startsWith('/app');

  return (
    <header
      className="no-print"
      style={{
        height: 'var(--navbar-height)',
        backgroundColor: 'var(--color-surface)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: 'var(--color-text)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="container flex items-center justify-between" style={{ height: '100%' }}>
        {/* Left: Brand & Sidebar Trigger */}
        <div className="flex items-center gap-3">
          {isDashboardView && (
            <button
              onClick={onToggleSidebar}
              style={{
                color: 'var(--color-primary)',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
              aria-label="Toggle Dashboard Sidebar"
            >
              <Menu size={20} />
            </button>
          )}

          <Link to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '10px',
                background: 'var(--color-secondary)',
              }}
            >
              <img
                src="/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png"
                alt="KRISHI-MITRA"
                style={{ height: '42px', width: 'auto', objectFit: 'contain', display: 'block', borderRadius: '6px', background: '#FFFFFF' }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    lineHeight: 1,
                    letterSpacing: '-0.02em'
                  }}
                >
                  KRISHI<span style={{ color: 'var(--color-primary)' }}>MITRA</span>
                </span>
              </div>
              <span
                className="navbar-brand-subtitle"
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.04em',
                  fontWeight: 600,
                  marginTop: '3px'
                }}
              >
                {t('Smart Agriculture & Allied Sector Monitoring', 'স্মার্ট কৃষি ও অনুসঙ্গি খাত পর্যবেক্ষণ ব্যবস্থা')}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="flex items-center"
          style={{ display: 'none', gap: '1.35rem' }}
          id="desktop-nav"
        >
          <Link
            to="/"
            style={{
              color: location.pathname === '/' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            {t('Home', 'হোম')}
          </Link>
          <Link
            to="/app/overview"
            style={{
              color: location.pathname.startsWith('/app/overview') ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            {t('My Farm', 'আমার খামার')}
          </Link>
          <Link
            to="/app/climate"
            style={{
              color: location.pathname.startsWith('/app/climate') ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            {t('Weather & Alerts', 'আবহাওয়া ও সতর্কবার্তা')}
          </Link>
          <Link
            to="/app/crop-planner"
            style={{
              color: location.pathname.startsWith('/app/crop-planner') ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            {t('Crop Planner', 'ফসল পরিকল্পনা')}
          </Link>
          <Link
            to="/about"
            style={{
              color: location.pathname === '/about' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            {t('About', 'প্রকল্প সম্পর্কে')}
          </Link>
        </nav>

        {/* Right: Controls, Active Farm Switcher, Notifications */}
        <div className="flex items-center gap-2">
          {/* Active Farm Selector */}
          {activeFarm && (
            <div ref={farmDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFarmDropdown(!showFarmDropdown)}
                aria-label="Switch Active Farm"
                className="flex items-center gap-2"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  padding: '0.38rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <MapPin size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span
                  className="navbar-farm-label"
                  style={{
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {activeFarm.district} • {formatArea(activeFarm)}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
              </button>

              {/* Farm Switcher Dropdown Menu */}
              {showFarmDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 'min(310px, calc(100vw - 24px))',
                    background: 'var(--color-surface)',
                    backdropFilter: 'blur(20px)',
                    color: 'var(--color-text)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--color-border)',
                    zIndex: 250,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '0.7rem 0.95rem',
                      background: 'var(--color-secondary)',
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      letterSpacing: '0.06em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{t('SELECT FARM PLOT', 'খামার নির্বাচন করুন')}</span>
                    <span>{farms.length} PLOTS</span>
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {farms.map((f) => {
                      const isSelected = f.id === activeFarm.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => {
                            switchFarm(f.id);
                            setShowFarmDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.75rem 0.95rem',
                            borderBottom: '1px solid var(--color-border)',
                            background: isSelected ? 'var(--color-success-bg)' : 'transparent',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                            cursor: 'pointer'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <strong
                              style={{
                                fontSize: '0.85rem',
                                color: isSelected ? 'var(--color-primary)' : 'var(--color-text)'
                              }}
                            >
                              {f.name}
                            </strong>
                            {isSelected && (
                              <CheckCircle size={15} style={{ color: 'var(--color-primary)' }} />
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {f.district} • {f.agroClimaticZone || 'West Bengal'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--color-primary)'
                            }}
                          >
                            {Number(f.latitude).toFixed(4)}°N, {Number(f.longitude).toFixed(4)}°E •{' '}
                            {formatArea(f)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      padding: '0.65rem 0.95rem',
                      textAlign: 'center',
                      background: 'var(--color-surface)',
                      borderTop: '1px solid var(--color-border)'
                    }}
                  >
                    <Link
                      to="/app/register-farm"
                      onClick={() => setShowFarmDropdown(false)}
                      className="flex items-center justify-center gap-1"
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)'
                      }}
                    >
                      <PlusCircle size={14} />
                      <span>{t('Add New Farm Plot', 'নতুন খামার যোগ করুন')}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Dropdown */}
          <div ref={notifDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                padding: '0.45rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                cursor: 'pointer'
              }}
              aria-label="Notifications"
            >
              <Bell size={17} />
              {notifications.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '9px',
                    height: '9px',
                    background: 'var(--color-primary)',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px var(--color-primary)'
                  }}
                />
              )}
            </button>

            {showNotifDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 'min(320px, calc(100vw - 24px))',
                  background: 'var(--color-surface)',
                  backdropFilter: 'blur(20px)',
                  color: 'var(--color-text)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--color-border)',
                  zIndex: 250,
                  maxHeight: '380px',
                  overflowY: 'auto'
                }}
              >
                <div
                  style={{
                    padding: '0.7rem 1rem',
                    background: 'var(--color-secondary)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    letterSpacing: '0.06em'
                  }}
                >
                  {t('FARM ALERTS & NOTIFICATIONS', 'খামার সতর্কবার্তা ও বিজ্ঞপ্তি')}
                </div>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: '1.25rem',
                      textAlign: 'center',
                      fontSize: '0.84rem',
                      color: 'var(--color-text-muted)'
                    }}
                  >
                    {t('No unread alerts.', 'কোনো অপঠিত সতর্কবার্তা নেই।')}
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.8rem 1rem',
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div
                        className="flex items-center justify-between"
                        style={{ marginBottom: '0.25rem' }}
                      >
                        <strong style={{ color: 'var(--color-primary)', fontSize: '0.83rem' }}>
                          {n.title}
                        </strong>
                        <button
                          onClick={() => dismissNotification(n.id)}
                          aria-label={`Dismiss ${n.title}`}
                          style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.9rem',
                            padding: '0 0.25rem'
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: 'var(--color-text)',
                          fontSize: '0.78rem',
                          lineHeight: 1.45
                        }}
                      >
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Switch language"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginLeft: '0.25rem'
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {language === 'en' ? 'EN' : language === 'bn' ? 'বাংলা' : 'हिंदी'}
            </span>
          </button>

          {/* Quick Dashboard Action */}
          {!isDashboardView && (
            <Link
              to="/app/overview"
              className="btn btn-sm btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <MapPin size={14} />
              <span>{t('My Farm', 'আমার খামার')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
