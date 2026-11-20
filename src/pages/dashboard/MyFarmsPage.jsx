import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { MapPin, Plus, CheckCircle, ArrowRight, Compass } from 'lucide-react';
import DemoBadge from '../../components/common/DemoBadge';
import FarmMap from '../../components/map/FarmMap';

export default function MyFarmsPage() {
  const { farms, activeFarm, switchFarm, formatArea, t } = useFarm();
  const navigate = useNavigate();

  return (
    <div>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '1.35rem', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            {t('My Farm Plots', 'আমার খামার')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {t('View your farm locations, check district details, and switch your active plot.', 'আপনার খামারের অবস্থান দেখুন, জেলার বিবরণ যাচাই করুন, এবং সক্রিয় খামার পরিবর্তন করুন।')}
          </p>
        </div>

        <Link to="/app/register-farm" className="btn btn-primary">
          <Plus size={18} />
          <span>{t('Add New Plot', 'নতুন খামার যোগ করুন')}</span>
        </Link>
      </div>

      {/* Map */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="card-header" style={{ marginBottom: '0.75rem' }}>
          <h3 className="card-title">
            <Compass size={18} style={{ color: 'var(--color-primary)' }} />
            <span>{t('Farm Plot Map', 'খামারের মানচিত্র')}</span>
          </h3>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
            {farms.length} {t('PLOTS', 'খামার')}
          </span>
        </div>
        <FarmMap
          farms={farms}
          activeFarm={activeFarm}
          onSelectFarm={switchFarm}
          height={340}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {farms.map((farm) => {
          const isActive = activeFarm && activeFarm.id === farm.id;
          const lat = farm.coordinates?.latitude ?? farm.latitude;
          const lng = farm.coordinates?.longitude ?? farm.longitude;

          return (
            <div
              key={farm.id}
              className="card"
              style={{
                border: isActive
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: '0.85rem' }}>
                  <DemoBadge
                    label={farm.id?.startsWith('farm-custom') ? 'REGISTERED' : 'SAMPLE'}
                    isLive={farm.id?.startsWith('farm-custom')}
                  />
                  {isActive && (
                    <span className="badge badge-success">
                      <CheckCircle size={12} />
                      {t('Active', 'সক্রিয়')}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.22rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                  {farm.name}
                </h3>

                <div
                  className="flex items-center gap-1"
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--color-primary)',
                    marginBottom: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <MapPin size={14} />
                  <span>
                    {farm.village ? `${farm.village}, ` : ''}
                    {farm.district}
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    padding: '0.8rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('Plot Area:', 'খামারের এলাকা:')}</span>
                    <strong style={{ color: 'var(--color-primary)' }}>{formatArea(farm)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('Coordinates:', 'স্থানাঙ্ক:')}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {Number(lat).toFixed(4)}°N, {Number(lng).toFixed(4)}°E
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('Crop:', 'ফসল:')}</span>
                    <strong style={{ color: 'var(--color-text)' }}>
                      {farm.currentCrop || farm.mainCrop}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('Zone:', 'অঞ্চল:')}</span>
                    <span style={{ color: 'var(--color-primary)' }}>
                      {farm.agroClimaticZone || 'West Bengal'}
                    </span>
                  </div>
                </div>

                {farm.description && (
                  <p
                    style={{
                      fontSize: '0.79rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                      marginBottom: '1rem'
                    }}
                  >
                    {farm.description}
                  </p>
                )}
              </div>

              <div
                className="flex items-center gap-2"
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '0.85rem'
                }}
              >
                {!isActive ? (
                  <button
                    onClick={() => switchFarm(farm.id)}
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1 }}
                  >
                    {t('Select as Active', 'সক্রিয় হিসেবে নির্বাচন করুন')}
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn btn-sm btn-ghost"
                    style={{ flex: 1, color: 'var(--color-primary)', fontWeight: 700 }}
                  >
                    ✓ {t('Active', 'সক্রিয়')}
                  </button>
                )}

                <button
                  onClick={() => {
                    switchFarm(farm.id);
                    navigate('/app/overview');
                  }}
                  className="btn btn-sm btn-primary"
                >
                  <span>{t('Open My Farm', 'আমার খামার খুলুন')}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
