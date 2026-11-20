import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FarmProvider } from './context/FarmContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

// Dashboard Pages
import OverviewPage from './pages/dashboard/OverviewPage';
import MyFarmsPage from './pages/dashboard/MyFarmsPage';
import RegisterFarmPage from './pages/dashboard/RegisterFarmPage';
import ClimatePage from './pages/dashboard/ClimatePage';
import SatellitePage from './pages/dashboard/SatellitePage';
import RiskPage from './pages/dashboard/RiskPage';
import CropPlannerPage from './pages/dashboard/CropPlannerPage';
import RecoveryPage from './pages/dashboard/RecoveryPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import ResearchPage from './pages/dashboard/ResearchPage';
import SettingsPage from './pages/dashboard/SettingsPage';

const LOGO_URL = '/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png';

export default function App() {
  const [showOpeningLogo, setShowOpeningLogo] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    return !sessionStorage.getItem('krishi_mitra_logo_seen');
  });

  useEffect(() => {
    if (!showOpeningLogo) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem('krishi_mitra_logo_seen', '1');
      setShowOpeningLogo(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [showOpeningLogo]);

  return (
    <FarmProvider>
      {showOpeningLogo && (
        <div
          onClick={() => {
            sessionStorage.setItem('krishi_mitra_logo_seen', '1');
            setShowOpeningLogo(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            cursor: 'pointer'
          }}
        >
          <img
            src={LOGO_URL}
            alt="KRISHI-MITRA — Smart Kisan • Samriddh Bharat"
            style={{
              maxWidth: 'min(480px, 88vw)',
              maxHeight: '65vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Farm Dashboard Application Routes */}
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/app/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            {/* Redirects for removed legacy routes */}
            <Route path="institutional" element={<Navigate to="/app/overview" replace />} />
            <Route path="gis-explorer" element={<Navigate to="/app/satellite" replace />} />
            <Route path="field-visits" element={<Navigate to="/app/recovery" replace />} />
            <Route path="farms" element={<MyFarmsPage />} />
            <Route path="register-farm" element={<RegisterFarmPage />} />
            <Route path="climate" element={<ClimatePage />} />
            <Route path="satellite" element={<SatellitePage />} />
            <Route path="risk" element={<RiskPage />} />
            <Route path="crop-planner" element={<CropPlannerPage />} />
            <Route path="recovery" element={<RecoveryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="research" element={<ResearchPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FarmProvider>
  );
}
