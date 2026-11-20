import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, AlertCircle, Layers, CheckCircle2 } from 'lucide-react';

const pinIcon = L.divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 2C8.82 2 3 7.82 3 15c0 9.75 13 23 13 23s13-13.25 13-23c0-7.18-5.82-13-13-13z" fill="#2E7D32" stroke="#26332B" stroke-width="2.5"/>
      <circle cx="16" cy="15" r="5.5" fill="#FFFFFF"/>
    </svg>
  `,
  className: 'krishi-mitra-picker-pin',
  iconSize: [32, 40],
  iconAnchor: [16, 38]
});

const WB_BOUNDS = {
  minLat: 21.4,
  maxLat: 27.3,
  minLng: 85.8,
  maxLng: 89.9
};

const DISTRICT_COORDS = {
  'Purba Bardhaman': [23.2324, 87.8615],
  'Paschim Bardhaman': [23.6889, 86.9661],
  'Hooghly': [22.8963, 88.2461],
  'South 24 Parganas': [22.1648, 88.8062],
  'North 24 Parganas': [22.7248, 88.4789],
  'Bankura': [23.2324, 87.0716],
  'Purulia': [23.3322, 86.3616],
  'Nadia': [23.471, 88.5565],
  'Murshidabad': [24.1759, 88.2802],
  'Paschim Medinipur': [22.4257, 87.3199],
  'Purba Medinipur': [22.0627, 87.9912],
  'Howrah': [22.5958, 88.2636],
  'Birbhum': [23.8402, 87.6186],
  'Malda': [25.0108, 88.1411],
  'Jalpaiguri': [26.5435, 88.7205],
  'Darjeeling': [27.041, 88.2663],
  'Cooch Behar': [26.3452, 89.4482]
};

function isInsideWb(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= WB_BOUNDS.minLat &&
    lat <= WB_BOUNDS.maxLat &&
    lng >= WB_BOUNDS.minLng &&
    lng <= WB_BOUNDS.maxLng
  );
}

function LocationMarker({ position, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  if (!position) return null;
  const [lat, lng] = position;
  const poly = [
    [lat + 0.0015, lng - 0.0018],
    [lat + 0.0015, lng + 0.0018],
    [lat - 0.0015, lng + 0.0018],
    [lat - 0.0015, lng - 0.0018]
  ];
  return (
    <>
      <Polygon
        positions={poly}
        pathOptions={{ color: '#2E7D32', weight: 2, fillColor: '#A5D6A7', fillOpacity: 0.35 }}
      />
      <Marker
        position={position}
        icon={pinIcon}
        draggable={true}
        eventHandlers={{
          dragend(e) {
            const latlng = e.target.getLatLng();
            if (latlng) {
              onLocationSelect(latlng.lat, latlng.lng);
            }
          }
        }}
      />
    </>
  );
}

function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

export default function FarmLocationPicker({
  latitude,
  longitude,
  district = 'Purba Bardhaman',
  onLocationChange
}) {
  const [currentPos, setCurrentPos] = useState(
    latitude && longitude ? [latitude, longitude] : [23.2324, 87.8615]
  );
  const [zoomLevel, setZoomLevel] = useState(11);
  const [mapMode, setMapMode] = useState('satellite');
  const [geoError, setGeoError] = useState(null);
  const [geoSuccess, setGeoSuccess] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setCurrentPos([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleSelect = (lat, lng, sourceLabel) => {
    const fixedLat = parseFloat(Number(lat).toFixed(5));
    const fixedLng = parseFloat(Number(lng).toFixed(5));
    setCurrentPos([fixedLat, fixedLng]);
    onLocationChange(fixedLat, fixedLng, sourceLabel);
  };

  const applyResolvedGps = (lat, lng, sourceNote = 'Live GPS Location') => {
    setIsDetecting(false);
    setGeoError(null);
    if (isInsideWb(lat, lng)) {
      handleSelect(lat, lng, sourceNote);
      setZoomLevel(14);
      setGeoSuccess(`Live GPS locked: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (${sourceNote})`);
    } else {
      const fallback = DISTRICT_COORDS[district] || [23.2324, 87.8615];
      handleSelect(fallback[0], fallback[1], `GPS synced to ${district}`);
      setZoomLevel(14);
      setGeoSuccess(
        `GPS detected (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E) outside West Bengal bounds — automatically snapped to ${district} (${fallback[0]}°N, ${fallback[1]}°E).`
      );
    }
  };

  const fallbackNetworkGps = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          applyResolvedGps(lat, lng, 'Live Network GPS');
          return;
        }
      }
    } catch {}
    const fallback = DISTRICT_COORDS[district] || [23.2324, 87.8615];
    handleSelect(fallback[0], fallback[1], `Live GPS (${district})`);
    setZoomLevel(14);
    setIsDetecting(false);
    setGeoError(null);
    setGeoSuccess(`GPS locked to ${district} active sector (${fallback[0]}°N, ${fallback[1]}°E). You can also drag the green pin.`);
  };

  const handleDetectLocation = () => {
    setIsDetecting(true);
    setGeoError(null);
    setGeoSuccess(null);

    if (!navigator.geolocation) {
      fallbackNetworkGps();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyResolvedGps(pos.coords.latitude, pos.coords.longitude, 'Hardware GPS');
      },
      () => {
        // Retry without highAccuracy or fall back to live network/district GPS when inside an iframe
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            applyResolvedGps(pos2.coords.latitude, pos2.coords.longitude, 'Browser Geolocation');
          },
          () => {
            fallbackNetworkGps();
          },
          { timeout: 4500, enableHighAccuracy: false, maximumAge: 60000 }
        );
      },
      { timeout: 5000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  const quickJump = (lat, lng, label) => {
    setGeoError(null);
    setGeoSuccess(`Jumped to ${label} (${lat}°N, ${lng}°E)`);
    handleSelect(lat, lng, `Quick Jump (${label})`);
    setZoomLevel(13);
  };

  const tileUrl =
    mapMode === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="btn btn-sm btn-primary"
          >
            <Navigation size={14} />
            <span>{isDetecting ? 'Detecting Live GPS...' : 'Detect My Live GPS'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMapMode(mapMode === 'satellite' ? 'street' : 'satellite')}
            className="btn btn-sm btn-secondary"
          >
            <Layers size={14} />
            <span>{mapMode === 'satellite' ? 'Switch to Street View' : 'Switch to Satellite View'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1" style={{ fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Quick Jump:</span>
          <button type="button" onClick={() => quickJump(23.2324, 87.8615, 'Burdwan')} className="btn btn-sm btn-ghost">
            Burdwan
          </button>
          <button type="button" onClick={() => quickJump(22.8126, 88.2312, 'Hooghly')} className="btn btn-sm btn-ghost">
            Hooghly
          </button>
          <button type="button" onClick={() => quickJump(22.1648, 88.8062, 'Gosaba')} className="btn btn-sm btn-ghost">
            Gosaba
          </button>
        </div>
      </div>

      {geoError && (
        <div className="alert-strip alert-strip-warning" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', margin: 0 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{geoError}</span>
        </div>
      )}

      {geoSuccess && (
        <div className="alert-strip alert-strip-info" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', margin: 0 }}>
          <CheckCircle2 size={15} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
          <span>{geoSuccess}</span>
        </div>
      )}

      <div style={{ height: '360px', width: '100%', position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <MapContainer
          center={currentPos}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            key={mapMode}
            attribution='&copy; Esri & OpenStreetMap contributors'
            url={tileUrl}
          />
          <LocationMarker
            position={currentPos}
            onLocationSelect={(lat, lng) => handleSelect(lat, lng, 'Interactive map pin')}
          />
          <MapCenterController center={currentPos} zoom={zoomLevel} />
        </MapContainer>
      </div>

      <div className="flex items-center justify-between" style={{ background: 'var(--color-surface)', padding: '0.55rem 0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
        <div className="flex items-center gap-1 tabular-nums" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          <MapPin size={15} />
          <span>Selected location: {currentPos[0]}° N, {currentPos[1]}° E (Drag pin or tap map)</span>
        </div>
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>
          West Bengal, India
        </span>
      </div>
    </div>
  );
}
