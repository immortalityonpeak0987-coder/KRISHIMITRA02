import React, { useState } from 'react';
import { Leaf, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function DataSourceCard({
  sourceName,
  product,
  resolution,
  observationDate,
  coverage,
  caveat,
  whatItHelpsUnderstand,
  dataState = 'SAMPLE DATA'
}) {
  const [showTechnical, setShowTechnical] = useState(false);

  const friendlyPurpose =
    whatItHelpsUnderstand ||
    (String(sourceName).includes('Crop')
      ? 'Helps choose crops that save water, improve soil fertility, and reduce pest risk.'
      : String(sourceName).includes('Recovery')
        ? 'Combines your farm notes with weather and moisture checks to track recovery after heavy rain or salinity.'
        : 'Helps understand weather patterns, soil moisture, and how green and healthy the crop looks.');

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.15rem',
        fontSize: '0.84rem',
        marginTop: '1.1rem',
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '0.7rem', flexWrap: 'wrap', gap: '0.5rem' }}
      >
        <span
          className="flex items-center gap-2"
          style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}
        >
          <Leaf size={16} />
          <span>Where this information comes from: {sourceName}</span>
        </span>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              background: 'var(--color-success-bg)',
              color: 'var(--color-primary)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(46, 125, 50, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            {dataState}
          </span>

          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.74rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <span>{showTechnical ? 'Hide technical details' : 'Learn more'}</span>
            {showTechnical ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Simple Farmer-Friendly Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          color: 'var(--color-text)',
          marginBottom: caveat ? '0.65rem' : 0,
          fontSize: '0.8rem'
        }}
      >
        <div>
          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>
            What it helps us understand:
          </span>
          <strong style={{ color: 'var(--color-text)', fontWeight: 600 }}>{friendlyPurpose}</strong>
        </div>

        {coverage && (
          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>
              Area covered by this data:
            </span>
            <strong style={{ color: 'var(--color-text)' }}>{coverage}</strong>
            {resolution && (
              <span style={{ color: 'var(--color-primary)', display: 'block', fontSize: '0.72rem' }}>
                ({resolution})
              </span>
            )}
          </div>
        )}

        {observationDate && (
          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.72rem' }}>
              Dates covered:
            </span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {observationDate}
            </strong>
          </div>
        )}
      </div>

      {/* Important Note / Caveat */}
      {caveat && (
        <div
          className="flex items-start gap-2"
          style={{
            fontSize: '0.77rem',
            color: 'var(--color-text-muted)',
            borderTop: '1px dashed var(--color-border)',
            paddingTop: '0.55rem',
            lineHeight: 1.45
          }}
        >
          <Info
            size={14}
            style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }}
          />
          <span>{caveat}</span>
        </div>
      )}

      {/* Expandable Technical Details ("Learn more") */}
      {showTechnical && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'var(--color-success-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(46, 125, 50, 0.3)',
            fontSize: '0.76rem',
            color: 'var(--color-text)'
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
            Technical Details & Data Source
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Dataset / Product: </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{product || sourceName}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Spatial Grid Resolution: </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{resolution || 'Regional Grid'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Missing Value Policy: </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                Flagged as missing, never treated as zero
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
