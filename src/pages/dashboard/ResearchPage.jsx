import React, { useState } from 'react';
import { Microscope, Database, FileCheck, ChevronDown, ChevronUp, Info, Leaf } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

const DATASET_PROVENANCE = [
  {
    dataset: 'Open Weather & Climate Archive',
    simpleTitle: 'Temperature, Sunshine & Seasonal Rainfall Patterns',
    whatItHelpsUnderstand:
      'Helps us understand normal seasonal temperatures, humidity, soil wetness, and whether recent rainfall is higher or lower than the regional average.',
    areaCovered: 'Regional weather grid (~50 km area around your district)',
    datesCovered: 'Multi-Year Baseline + Current Season',
    product: 'Daily & Monthly Agroclimatology',
    mission: 'Open weather and climate data sources',
    spatialResolution: '0.5° × 0.5° (~50 km)',
    parameters: 'Temperature, precipitation, humidity, solar radiation, soil moisture',
    scientificLimitation:
      'Gridded resolution reflects district-level weather patterns and does not capture tree shade or narrow canal micro-climates on a single plot.'
  },
  {
    dataset: 'Satellite Rainfall',
    simpleTitle: 'Recent Rainfall Totals',
    whatItHelpsUnderstand:
      'Helps track heavy rain spells, cyclone downpours, and waterlogging risk across your block.',
    areaCovered: 'Block-level rainfall grid (~10 km area)',
    datesCovered: 'Updated every 1–2 days (Last 7-day & 30-day totals)',
    product: 'Multi-satellite precipitation',
    mission: 'Satellite precipitation measurement',
    spatialResolution: '0.1° × 0.1° (~10 km)',
    parameters: 'Precipitation accumulation and rate',
    scientificLimitation:
      'Satellite rain estimates should be paired with local field drainage checks during localized downpours.'
  },
  {
    dataset: 'Satellite Soil Moisture',
    simpleTitle: 'Estimated Moisture in the Soil (Surface & Root Zone)',
    whatItHelpsUnderstand:
      'Helps see if the soil has enough residual moisture after monsoon rice harvest to sow winter pulses or mustard without heavy pumping.',
    areaCovered: 'Regional soil moisture grid (9 km area)',
    datesCovered: 'Current Cropping Season',
    product: 'Surface and Root-Zone Soil Moisture',
    mission: 'Satellite soil moisture sensing',
    spatialResolution: '9 km grid',
    parameters: 'Surface soil moisture (0–5 cm), root-zone moisture (0–100 cm)',
    scientificLimitation:
      'Provides 9 km regional moisture context; does not replace checking soil by hand or submitting a soil health card test.'
  },
  {
    dataset: 'Satellite Crop Greenness',
    simpleTitle: 'How Green & Healthy the Crop Looks',
    whatItHelpsUnderstand:
      'Shows crop growth stages from sowing through peak green canopy and harvest, and highlights patchy stress areas on the map.',
    areaCovered: 'Field-neighborhood satellite pixels (30 m to 250 m)',
    datesCovered: 'Current Cropping Season',
    product: 'Vegetation Index (NDVI)',
    mission: 'Optical satellite imaging',
    spatialResolution: '30m – 250m',
    parameters: 'NDVI (Normalized Difference Vegetation Index)',
    scientificLimitation:
      'Monsoon clouds can block optical views in July–August; greenness shows plant vigor, not specific pest or nutrient names.'
  },
  {
    dataset: 'Regional Crop Calendar',
    simpleTitle: 'Seasonal Crop Calendar & Rotation Rules',
    whatItHelpsUnderstand:
      'Guides 12-month crop rotations that save water, add nitrogen with pulses, and support sustainable farming decisions.',
    areaCovered: 'Agro-Climatic Zones (Alluvial, Coastal Saline, Red Lateritic)',
    datesCovered: '12-Month Seasonal Reference Calendar',
    product: 'Regional Crop Planning Calendar',
    mission: 'Regional agricultural extension references',
    spatialResolution: 'District & Agro-Climatic Zone Level',
    parameters: 'Sowing windows, crop duration, water requirement, salinity tolerance',
    scientificLimitation:
      'Agronomic suitability reflects soil and climate fit; always check local market demand and certified seed availability.'
  }
];

export default function ResearchPage() {
  const { t } = useFarm();
  const [showFullTechnicalTable, setShowFullTechnicalTable] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: '1.35rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          {t('Where Our Information Comes From', 'এই তথ্য কোথা থেকে আসে')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
          {t('Simple explanations of each weather and soil data source used in KRISHI-MITRA, with expandable technical details.', 'KRISHI-MITRA-এ ব্যবহৃত প্রতিটি আবহাওয়া ও মাটির তথ্যসূত্রের সহজ ব্যাখ্যা, কারিগরি বিবরনেরসহ।')}
        </p>
      </div>

      {/* Data Source Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}
      >
        {DATASET_PROVENANCE.map((ds, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <div className="flex items-center justify-between">
              <span className="badge badge-success">{ds.dataset}</span>
              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                {ds.spatialResolution}
              </span>
            </div>

            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text)', margin: 0 }}>{ds.simpleTitle}</h3>

            <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--color-primary)' }}>{t('What it helps us understand:', 'এটি আমাদের কী বুঝতে সাহায্য করে:')} </strong>
              {ds.whatItHelpsUnderstand}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{t('Area covered by this data:', 'এই তথ্যের আওতাধীন এলাকা:')} </strong>
              {ds.areaCovered}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{t('Dates covered:', 'তথ্যের সময়কাল:')} </strong>
              {ds.datesCovered}
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: '0.5rem',
                borderTop: '1px dashed var(--color-border)',
                fontSize: '0.74rem',
                color: 'var(--color-text-muted)'
              }}
            >
              <strong>{t('Keep in mind:', 'মনে রাখবেন:')} </strong>{ds.scientificLimitation}
            </div>
          </div>
        ))}
      </div>

      {/* Expandable Technical Matrix */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="flex items-center gap-2">
            <Database size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>
              {t('Technical Specifications & Parameters', 'কারিগরি বিবরণ ও প্যারামিটার')}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowFullTechnicalTable(!showFullTechnicalTable)}
            className="btn btn-xs btn-outline"
          >
            <span>{showFullTechnicalTable ? 'Hide Technical Table' : 'Learn More (Show Full Technical Matrix)'}</span>
            {showFullTechnicalTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showFullTechnicalTable && (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8rem',
                textAlign: 'left'
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--color-secondary)',
                    borderBottom: '2px solid var(--color-border)',
                    color: 'var(--color-text)'
                  }}
                >
                  <th style={{ padding: '0.75rem 0.6rem' }}>{t('Source & Product', 'উৎস ও পণ্য')}</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>{t('Spatial Grid', 'স্থানান্তরিক গ্রিড')}</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>{t('Variables / Parameters', 'চলক / প্যারামিটার')}</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>{t('Physical Limitation', 'শারೀರিক সীমাবদ্ধতা')}</th>
                </tr>
              </thead>
              <tbody>
                {DATASET_PROVENANCE.map((ds, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 0.6rem' }}>
                      <strong style={{ color: 'var(--color-text)' }}>{ds.dataset}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>{ds.product}</div>
                    </td>
                    <td
                      style={{
                        padding: '0.75rem 0.6rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-primary)'
                      }}
                    >
                      {ds.spatialResolution}
                    </td>
                    <td
                      style={{
                        padding: '0.75rem 0.6rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.73rem',
                        color: 'var(--color-text)'
                      }}
                    >
                      {ds.parameters}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                      {ds.scientificLimitation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation Section */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
          <FileCheck size={20} style={{ color: 'var(--color-primary)' }} />
          <span>{t('Data Quality & Limitations', 'তথ্যের গুণগত মান ও সীমাবদ্ধতা')}</span>
        </h3>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: '1rem'
          }}
        >
          {t('KRISHI-MITRA uses open weather and satellite data combined with regional agro-ecological guidelines. Gridded data reflects regional trends and does not replace plot-level laboratory testing or local agricultural officer verification.', 'KRISHI-MITRA খোলা আবহাওয়া ও উপগ্রহ তথ্য এবং আঞ্চলিক কৃষি-পরিবেশগত নির্দেশিকাসমন্বিত করে। গ্রিডেড তথ্য আঞ্চলিক প্রবণতা প্রতিফলিত করে এবং প্লট-স্তরের ল্যাব পরীক্ষা অথবা স্থানীয় কৃষি অফিসারের যাচাইয়ের বিকল্প নয়।')}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            fontSize: '0.82rem'
          }}
        >
          <div
            style={{
              padding: '0.9rem',
              background: 'var(--color-success-bg)',
              border: '1px solid rgba(46, 125, 50, 0.18)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <strong style={{ color: 'var(--color-primary)' }}>
              {t('Honest Data Labeling', 'সত্যি তথ্য লেবেলিং')}
            </strong>
            <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-muted)' }}>
              {t('Sample data is clearly marked as sample. No fabricated sensor readings are shown.', 'নমুনা তথ্য স্পষ্টভাবে নমুনা হিসেবে চিহ্নিত করা হয়। কোনো নকল সেন্সর পরিমাপ দেখানো হয় না।')}
            </p>
          </div>
          <div
            style={{
              padding: '0.9rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <strong style={{ color: 'var(--color-primary)' }}>
              {t('No Unimplemented AI Claims', 'কোনো বাস্তবায়িত AI দাবি নেই')}
            </strong>
            <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-muted)' }}>
              {t('Satellites show crop greenness and moisture context only. They cannot measure chemical N-P-K or soil salt directly.', 'উপগ্রহ শুধু ফলের সবুজতা ও আর্দ্রতার প্রেক্ষাপট দেখায়। তারা রাসায়নিক ন-পি-খ বা মাটির লবণ সরাসরি পরিমাপ করতে পারে না।')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
