import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight, Leaf, ShieldCheck, AlertTriangle, Globe } from 'lucide-react';
import { BRAND } from '../config/brand';

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-background)', padding: '3.5rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <img
            src="/assets/aistudio/file_000000008254821194a39b5f9b473b7c_37be7d74.png"
            alt="KRISHI-MITRA"
            style={{
              height: '120px',
              width: 'auto',
              marginBottom: '1.25rem',
              borderRadius: '14px',
              background: '#FFFFFF',
              padding: '0.35rem 0.75rem',
              border: '1px solid var(--color-border)'
            }}
          />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.6rem', color: 'var(--color-text)' }}>
            {BRAND.name}
          </h1>
          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {BRAND.title}
          </p>
        </div>

        {/* Competition Badge */}
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto 3rem',
            padding: '1rem',
            background: 'var(--color-success-bg)',
            border: '1px solid rgba(46, 125, 50, 0.3)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            {BRAND.competition}
          </span>
          <br />
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginTop: '0.25rem',
              display: 'block'
            }}
          >
            {BRAND.category} • Built by Team INOVATRIX
          </span>
        </div>

        {/* Problem Statement */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <AlertTriangle size={22} style={{ color: 'var(--color-warning)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Problem Statement
            </h2>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '1rem' }}>
            Smallholder farmers in Eastern India lack access to simple, affordable tools for weather,
            soil moisture, and crop health monitoring. Existing agricultural platforms are often too
            complex, expensive, or technically dense for rural users with limited digital literacy.
            Farmers need plain-language guidance on what to grow, when to irrigate, and how to recover
            after climate hazards such as waterlogging, salinity, or drought.
          </p>
        </div>

        {/* Proposed Solution */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Leaf size={22} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Proposed Solution
            </h2>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '1rem' }}>
            KRISHI-MITRA is a lightweight, farmer-friendly web application that provides:
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--color-text)', fontSize: '0.9rem' }}>
            <li>Simple weather, rainfall, and soil moisture summaries in plain language.</li>
            <li>12-month crop rotation planning suited to local agro-climatic zones.</li>
            <li>Soil pH, salinity, and multi-hazard risk screening with practical advisories.</li>
            <li>Farm recovery tracking with photo evidence and checklists.</li>
            <li>Printable farm advisory reports and CSV export.</li>
            <li>Bilingual interface (English and Bengali) and light/dark theme support.</li>
          </ul>
        </div>

        {/* Innovation & Uniqueness */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Innovation & Uniqueness
            </h2>
          </div>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--color-text)', fontSize: '0.9rem' }}>
            <li>
              <strong>Farmer-first design:</strong> Minimal interface with no nested menus, jargon,
              or unnecessary animations — usable by farmers with limited technical knowledge.
            </li>
            <li>
              <strong>Honest data:</strong> Clearly distinguishes sample/demo data from live data.
              No fabricated sensor readings or unimplemented AI claims.
            </li>
            <li>
              <strong>Lightweight:</strong> Optimized for slow rural networks and low-end mobile
              devices with fast loading and minimal dependencies.
            </li>
            <li>
              <strong>Allied-sector ready:</strong> Positioned for horticulture, livestock, dairy,
              fisheries, and poultry as future scope.
            </li>
          </ul>
        </div>

        {/* Agriculture & Allied Sector Relevance */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Globe size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Agriculture & Allied Sector Relevance
            </h2>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '1rem' }}>
            The solution directly supports:
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--color-text)', fontSize: '0.9rem' }}>
            <li>Smart agriculture and precision farming</li>
            <li>Soil moisture and soil condition monitoring</li>
            <li>Smart irrigation and water management</li>
            <li>Weather and rainfall monitoring</li>
            <li>Crop condition monitoring</li>
            <li>Horticulture and plantation monitoring</li>
            <li>Livestock and dairy management (future scope)</li>
            <li>Fisheries and aquaculture (future scope)</li>
            <li>Poultry farming (future scope)</li>
            <li>Agricultural environmental monitoring</li>
            <li>Farmer alerts and notifications</li>
            <li>Resource optimization and sustainability</li>
          </ul>
        </div>

        {/* Technical Architecture */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Users size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Technical Architecture
            </h2>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '1rem' }}>
            KRISHI-MITRA uses a simple full-stack architecture:
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--color-text)', fontSize: '0.9rem' }}>
            <li><strong>Frontend:</strong> React 18 + Vite, system fonts, Leaflet maps, Recharts charts.</li>
            <li><strong>Backend:</strong> Express.js server with optional MongoDB and in-memory fallback.</li>
            <li><strong>Data:</strong> Open weather and satellite datasets with regional agricultural baselines.</li>
            <li><strong>Reports:</strong> PDF and CSV generation for printable farm advisories.</li>
            <li><strong>Deployment:</strong> Vercel-ready serverless functions or standalone Node server.</li>
          </ul>
        </div>

        {/* Hardware & Software Components */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Hardware & Software Components
            </h2>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '1rem' }}>
            The current version runs on a farmer's existing smartphone or computer. No dedicated
            field sensor hardware is required; sensor integration is part of future scope.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div
              style={{
                padding: '0.85rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>Frontend:</strong>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                React 18, Vite, React Router, Leaflet, Recharts, Lucide icons
              </p>
            </div>
            <div
              style={{
                padding: '0.85rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>Backend:</strong>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Express.js, Mongoose (optional), PDFKit, CSV export
              </p>
            </div>
            <div
              style={{
                padding: '0.85rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>Data Sources:</strong>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Open weather & satellite APIs, regional baselines, in-memory fallback
              </p>
            </div>
            <div
              style={{
                padding: '0.85rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <strong style={{ color: 'var(--color-primary)' }}>Deploy:</strong>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Vercel serverless, Node.js on port 3000
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Leaf size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Benefits to Farmers & Rural Communities
            </h2>
          </div>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--color-text)', fontSize: '0.9rem' }}>
            <li>Clear, plain-language weather and soil guidance without technical jargon.</li>
            <li>Better decisions on crop selection, sowing windows, and irrigation.</li>
            <li>Early awareness of waterlogging, salinity, and heat stress risks.</li>
            <li>Soil recovery tracking after climate hazards.</li>
            <li>Printable reports for sharing with extension officers and Krishi Vigyan Kendras.</li>
            <li>Works on basic smartphones with slow internet connections.</li>
          </ul>
        </div>

        {/* Sustainability */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Leaf size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Sustainability & Resource Optimization
            </h2>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '1rem' }}>
            KRISHI-MITRA promotes water conservation through crop rotation planning, reduces
            unnecessary irrigation, supports nitrogen-fixing legume rotations, and helps farmers
            avoid crop losses from weather hazards — contributing to long-term soil health and
            sustainable farming.
          </p>
        </div>

        {/* Real-World Applications */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Leaf size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Real-World Applications
            </h2>
          </div>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--color-text)', fontSize: '0.9rem' }}>
            <li>Daily farming decisions: what to sow, when to irrigate, when to harvest.</li>
            <li>Post-flood or post-cyclone recovery tracking for affected plots.</li>
            <li>Soil salinity management in coastal delta regions.</li>
            <li>Crop diversification planning for smallholder farmers.</li>
            <li>Field evidence logging for farmer producer organizations (FPOs) and extension workers.</li>
          </ul>
        </div>

        {/* Scalability */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Globe size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Scalability
            </h2>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '1rem' }}>
            The application is architected to scale from a West Bengal pilot to other Indian states
            and regions. Regional districts, crops, and units (Bigha, Acre, Hectare) are configurable.
            Future phases can add multilingual support, voice alerts, and allied-sector modules
            without rewriting the core platform.
          </p>
        </div>

        {/* Future Scope */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <ArrowRight size={20} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--color-text)' }}>
              Future Scope
            </h2>
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text)', marginBottom: '1rem' }}>
            The following are planned future enhancements and are not yet implemented:
          </p>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--color-text)', fontSize: '0.9rem' }}>
            <li>Livestock and dairy management module</li>
            <li>Fisheries and aquaculture monitoring</li>
            <li>Poultry farming tools</li>
            <li>Expanded regional coverage beyond West Bengal</li>
            <li>Additional Indian languages and voice-first access</li>
            <li>Integration with government soil health and weather portals</li>
          </ul>
        </div>

        {/* Implemented vs Planned */}
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-text)' }}>
              Implemented vs Planned Features
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                ✓ Implemented
              </h4>
              <ul style={{ paddingLeft: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                <li>Farm registration & plot management</li>
                <li>Weather, rainfall & soil moisture monitoring</li>
                <li>Crop health mapping</li>
                <li>12-month crop planner</li>
                <li>Soil pH, salinity & risk screening</li>
                <li>Farm recovery tracker</li>
                <li>PDF/CSV farm reports</li>
                <li>Bilingual EN/BN interface</li>
                <li>Light/dark theme</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                ○ Planned (Future Scope)
              </h4>
              <ul style={{ paddingLeft: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                <li>Livestock & dairy management</li>
                <li>Fisheries & aquaculture</li>
                <li>Poultry farming tools</li>
                <li>Voice-first farmer alerts</li>
                <li>Multi-state regional expansion</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            marginTop: '2.75rem',
            padding: '1rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)'
          }}
        >
          {BRAND.disclaimer}
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center', marginTop: '2.75rem' }}>
          <Link to="/app/overview" className="btn btn-lg btn-primary">
            <Leaf size={18} />
            <span>Open My Farm Dashboard</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
