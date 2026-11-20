import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Leaf } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div
      style={{
        padding: '6rem 1rem',
        textAlign: 'center',
        backgroundColor: 'var(--color-background)',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div className="container" style={{ maxWidth: '520px' }}>
        <Leaf size={64} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '4.5rem', color: 'var(--color-primary)', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.85rem', color: 'var(--color-text)' }}>
          Plot Not Found
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          The farm page or route you requested does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Home size={18} />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
