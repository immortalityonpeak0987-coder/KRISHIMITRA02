import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { reportService } from '../../services/reportService';
import { Printer, Download, FileText } from 'lucide-react';

export default function ReportsPage() {
  const { activeFarm, t } = useFarm();
  const [report, setReport] = useState(null);

  useEffect(() => {
    async function fetchReport() {
      if (!activeFarm) return;
      try {
        const rep = await reportService.generateFarmReport(activeFarm.id);
        setReport(rep);
      } catch (err) {
        console.error('Failed to generate report:', err);
      }
    }
    fetchReport();
  }, [activeFarm]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (report) {
      reportService.exportToCSV(report);
    }
  };

  if (!activeFarm || !report) {
    return (
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text)' }}>
        {t('Compiling farm advisory report...', 'খামার পরামর্শ প্রতিবেদন গুচ্ছ করা হচ্ছে...')}
      </div>
    );
  }

  const { farm, climate, risks, rotation } = report;
  const topPlan = rotation && rotation[0];

  return (
    <div>
      {/* Top Controls Bar */}
      <div
        className="flex items-center justify-between no-print"
        style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            {t('Farm Advisory Report', 'খামার পরামর্শ প্রতিবেদন')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {t('Printable farm advisory summary with weather, soil, risk, and crop plan information.', 'আবহাওয়া, মাটি, ঝুঁকি ও ফসল পরিকল্পনার তথ্য সহ প্রিন্টযোগ্য খামার পরামর্শ সারাংশ।')}
          </p>
        </div>

        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="btn btn-sm btn-secondary">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <a
            href={`/api/reports/${activeFarm.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline"
          >
            <FileText size={15} />
            <span>{t('Download PDF', 'পিডিএফ ডাউনলোড')}</span>
          </a>
          <button onClick={handlePrint} className="btn btn-sm btn-primary">
            <Printer size={15} />
            <span>{t('Print Report', 'প্রতিবেদন প্রিন্ট')}</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE REPORT SHEET */}
      <div
        id="printable-report"
        className="card print-sheet"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          padding: '2.25rem',
          maxWidth: '880px',
          margin: '0 auto 2rem',
          boxShadow: 'var(--shadow-card)',
          color: 'var(--color-text)'
        }}
      >
        {/* Report Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--color-primary)',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png"
              alt="KRISHI-MITRA"
              style={{ height: '56px', width: 'auto', borderRadius: '8px', background: '#FFFFFF' }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--color-text)',
                  lineHeight: 1
                }}
              >
                KRISHI<span style={{ color: 'var(--color-primary)' }}>MITRA</span>
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  marginTop: '4px'
                }}
              >
                Farm Advisory Report
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <div>
              <strong>{t('Report Ref:', 'প্রতিবেদন রেফ:')}</strong>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{report.reportId}</span>
            </div>
            <div>
              <strong>{t('Generated:', 'প্রকাশিত:')} </strong>{report.generatedAt}
            </div>
          </div>
        </div>

        {/* Section 1: Farm Information */}
        <div style={{ marginBottom: '1.5rem', background: 'var(--color-secondary)', border: '1px solid var(--color-border)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.35rem' }}>
            1. {t('Registered Plot Information', 'নিবন্ধিত খামারের বিবরণ')}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.84rem'
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>{t('Farm Name:', 'খামারের নাম:')}</span>
              <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{farm.name}</div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>{t('Location:', 'অবস্থান:')}</span>
              <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                {farm.village ? `${farm.village}, ` : ''}
                {farm.district}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>{t('Coordinates:', 'স্থানাঙ্ক:')}</span>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                {farm.coordinates.latitude}° N, {farm.coordinates.longitude}° E
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>{t('Plot Area:', 'খামারের এলাকা:')}</span>
              <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                {farm.area} {farm.areaUnit} ({farm.areaInAcres} Acres)
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>{t('Soil Classification:', 'মাটির শ্রেণিবিন্যাস:')}</span>
              <div style={{ color: 'var(--color-text)' }}>{farm.soilType}</div>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>{t('Agro-Climatic Zone:', 'কৃষি-জলবায়ু অঞ্চল:')}</span>
              <div style={{ color: 'var(--color-text)' }}>{farm.agroClimaticZone || 'West Bengal'}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Climate & Environmental Summary */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
            2. {t('Weather & Soil Summary', 'আবহাওয়া ও মাটির সারাংশ')}
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.82rem',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                padding: '0.8rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                {t('Temperature (T2M)', 'তাপমাত্রা')}
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {climate?.currentSnapshot?.temperature}°C
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                Min: {climate?.currentSnapshot?.minTemperature}°C • Max: {climate?.currentSnapshot?.maxTemperature}°C
              </span>
            </div>

            <div
              style={{
                padding: '0.8rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                {t('Monthly Rainfall', 'মাসিক বৃষ্টিপাত')}
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {climate?.currentSnapshot?.rainfallMonthlyToDate} mm
              </div>
            </div>

            <div
              style={{
                padding: '0.8rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                {t('Relative Humidity', 'আপেক্ষিক আর্দ্রতা')}
              </span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {climate?.currentSnapshot?.relativeHumidity}%
              </div>
            </div>

            <div
              style={{
                padding: '0.8rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                {t('Multi-Hazard Status', 'বহুমুখী ঝুঁকি')}
              </span>
              <div
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: risks?.overallRiskLevel?.includes('High') ? '#C62828' : 'var(--color-primary)',
                  marginTop: '4px'
                }}
              >
                {risks?.overallRiskLevel || 'Moderate'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Crop Rotation */}
        {topPlan && (
          <div style={{ marginBottom: '1.5rem', border: '1.5px solid var(--color-primary)', padding: '1.1rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'var(--color-success-bg)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text)', margin: 0 }}>
                3. {t('Primary Recommended Crop Rotation', 'প্রধান সুপারিশকৃত ফসল আবর্তন')}
              </h3>
              <span className="badge badge-success">{t('HIGHEST RESILIENCE', 'সর্বোচ্চ সহনীয়তা')}</span>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
              {topPlan.sequence}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.55rem',
                marginBottom: '0.85rem'
              }}
            >
              {(topPlan.timing || []).map((tItem, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--color-surface)',
                    padding: '0.55rem 0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                    {tItem.window} ({tItem.duration})
                  </div>
                  <strong style={{ color: 'var(--color-text)' }}>{tItem.crop}</strong>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    {tItem.type}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--color-text-muted)' }}>
              <div>
                <strong>{t('• Water Conservation:', 'জল সংরক্ষণ:')} </strong>
                {topPlan.waterBalance?.estimatedSavings}. {topPlan.waterBalance?.groundwaterImpact}.
              </div>
              <div>
                <strong>{t('• Soil Nitrogen Restoration:', 'মাটির নাইট্রোজেন পুনরুদ্ধার:')} </strong>
                {topPlan.soilBenefit?.nitrogenContribution}.
              </div>
              <div>
                <strong>{t('• Pest Cycle Interruption:', 'পোকা-চক্র ভাঙন:')} </strong>
                {topPlan.pestCycleBreak}
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Farmer Actions */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
            4. {t('Recommended Field Actions', 'সুপারিশকৃত খেতের কাজ')}
          </h3>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.65 }}>
            <li>
              {t('Conduct a laboratory soil EC/pH test at the nearest agricultural center, especially in coastal areas.', 'নিকটতম কৃষি কেন্দ্রে মাটির ইসি/পিএইচ পরীক্ষা করুন, বিশেষ করে তটবর্তী এলাকায়।')}
            </li>
            <li>
              {t('Retain paddy straw mulch to conserve soil moisture and reduce salt rise.', 'মাটির আর্দ্রতা সংরক্ষণ ও লবণ বৃদ্ধি হ্রাসের জন্য ধানের খড়ের মালচ রেখে দিন।')}
            </li>
            <li>
              {t('Introduce a short-duration summer legume (Moong / Lentil / Khesari) to restore nitrogen.', 'নাইট্রোজেন পুনরুদ্ধারের জন্য অল্প সময়ের গ্রীষ্মকালীন দল (মুঙ্গ / মসুর / খেসারি) প্রবর্তন করুন।')}
            </li>
          </ul>
        </div>

        {/* Report Footer & Disclaimer */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1rem',
            fontSize: '0.74rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5
          }}
        >
          <div>
            <strong>{t('Data Sources:', 'তথ্যসূত্র:')} </strong>
            Open weather and satellite data sources used for regional context.
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <strong>{t('Disclaimer:', 'দাবি ত্যাগ:')} </strong>
            {t('This advisory report synthesizes open weather and soil data with regional agro-ecological guidelines. It provides decision support for farmers. Direct ground verification is recommended before committing significant interventions.', 'এই পরামর্শ প্রতিবেদনটি খোলা আবহাওয়া ও মাটির তথ্য এবং আঞ্চলিক কৃষি-পরিবেশগত নির্দেশিকাসহ লিপিবদ্ধ করে। এটি কৃষকদের সিদ্ধান্ত সহায়তা প্রদান করে। উল্লেখযোগ্য হস্তক্ষেপের আগে সরাসরি জমির যাচাইয়ের পরামর্শ দেওয়া হচ্ছে।')}
          </div>
        </div>
      </div>
    </div>
  );
}
