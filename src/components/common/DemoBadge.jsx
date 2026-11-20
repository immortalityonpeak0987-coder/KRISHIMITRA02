import React from 'react';
import { Database, Radio } from 'lucide-react';

export default function DemoBadge({ label = 'SAMPLE DATA', isLive = false }) {
  if (isLive) {
    return (
      <span
        className="badge badge-success"
        title="Live data retrieved from backend service"
      >
        <Radio size={11} />
        {label === 'SAMPLE DATA' ? 'LIVE DATA' : label}
      </span>
    );
  }

  return (
    <span
      className="badge badge-warning"
      title="Calibrated sample data for demonstration purposes"
    >
      <Database size={11} />
      {label}
    </span>
  );
}
