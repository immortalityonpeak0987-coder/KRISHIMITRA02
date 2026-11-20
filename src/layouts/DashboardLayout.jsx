import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import KisanSahayakDrawer from '../components/ai/KisanSahayakDrawer';
import { useFarm } from '../context/FarmContext';
import { MapPin, Sprout } from 'lucide-react';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    activeFarm,
    farms,
    formatArea,
    t,
  } = useFarm();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-background)' }}>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          style={{
            flex: 1,
            padding: '1.25rem 1.5rem 2.5rem',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
          <div className="container" style={{ padding: 0 }}>
            {/* Top Active Farm Strip */}
            {activeFarm && (
              <div
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  padding: '0.9rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      background: 'var(--color-success-bg)',
                      border: '1px solid rgba(46, 125, 50, 0.35)',
                      padding: '0.55rem',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--color-text)' }}>
                        {activeFarm.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          background: 'rgba(46, 125, 50, 0.1)',
                          color: 'var(--color-primary)',
                          border: '1px solid rgba(46, 125, 50, 0.2)'
                        }}
                      >
                        {Number(activeFarm.latitude).toFixed(4)}°N, {Number(activeFarm.longitude).toFixed(4)}°E
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '2px'
                      }}
                    >
                      {activeFarm.village ? `${activeFarm.village}, ` : ''}
                      {activeFarm.block ? `${activeFarm.block}, ` : ''}
                      <strong style={{ color: 'var(--color-text)' }}>{activeFarm.district}</strong> •{' '}
                      {activeFarm.agroClimaticZone || 'West Bengal'} •{' '}
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        {formatArea(activeFarm)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                  <div
                    className="flex items-center gap-1"
                    style={{
                      fontSize: '0.76rem',
                      background: 'var(--color-success-bg)',
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(46, 125, 50, 0.35)'
                    }}
                  >
                    <Sprout size={13} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('Current Crop:', 'বর্তমান ফসল:')}</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{activeFarm.currentCrop}</strong>
                  </div>
                </div>
              </div>
            )}

            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
      <KisanSahayakDrawer />
    </div>
  );
}
