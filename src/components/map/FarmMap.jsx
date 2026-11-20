import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Circle,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  RotateCcw,
  Search,
  MapPin,
  Droplets,
  Sprout,
  AlertTriangle,
  Globe,
  Eye,
  Compass
} from 'lucide-react';

// Documented, legitimate tile providers with full attribution
const BASE_LAYERS = {
  satellite: {
    id: 'satellite',
    label: 'Satellite (Esri World Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS'
  },
  street: {
    id: 'street',
    label: 'Street Map (OpenStreetMap)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  terrain: {
    id: 'terrain',
    label: 'Terrain & Elevation (OpenTopoMap)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
  }
};

// Custom SVG pin icon matching the KRISHI-MITRA palette
function createFarmIcon(isSelected, isCoastal) {
  const fill = isSelected ? '#2E7D32' : isCoastal ? '#DCC9A3' : '#78847B';
  const stroke = '#26332B';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 2C8.82 2 3 7.82 3 15c0 9.75 13 23 13 23s13-13.25 13-23c0-7.18-5.82-13-13-13z" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <circle cx="16" cy="15" r="5.5" fill="#FFFFFF"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'krishi-mitra-custom-pin',
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -34]
  });
}

// Map viewport controller + tile error listener
function MapViewportController({ center, zoom, onTileError }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);

  useMapEvents({
    tileerror() {
      if (onTileError) onTileError(true);
    },
    tileload() {
      if (onTileError) onTileError(false);
    }
  });

  return null;
}

// Coastal salinity hazard polygon covering Sundarbans deltaic corridor (South & North 24 Parganas)
const SUNDARBANS_SALINITY_CORRIDOR = [
  [22.38, 88.35],
  [22.42, 89.05],
  [21.65, 89.08],
  [21.62, 88.15]
];

export default function FarmMap({
  farms = [],
  activeFarm,
  onSelectFarm,
  satelliteData,
  climateData,
  riskData,
  selectedTemporalStep = null,
  height = '480px'
}) {
  const [baseLayer, setBaseLayer] = useState('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);
  const [searchQuery, setSearchQuery] = useState('');
  const [tileWarning, setTileWarning] = useState(false);
  const [geoStatus, setGeoStatus] = useState(null);

  // Toggleable GIS layers
  const [layers, setLayers] = useState({
    boundaries: true,
    ndvi: true,
    soilMoisture: true,
    rainfall: false,
    salinityZone: true
  });

  const activeCoords = activeFarm?.coordinates
    ? [activeFarm.coordinates.latitude, activeFarm.coordinates.longitude]
    : [23.2324, 87.8615];

  const [mapCenter, setMapCenter] = useState(activeCoords);
  const [mapZoom, setMapZoom] = useState(14);

  useEffect(() => {
    if (activeFarm?.coordinates) {
      setMapCenter([activeFarm.coordinates.latitude, activeFarm.coordinates.longitude]);
      setMapZoom(14);
    }
  }, [activeFarm]);

  const toggleLayer = (key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetToFarm = () => {
    if (activeFarm?.coordinates) {
      setMapCenter([activeFarm.coordinates.latitude, activeFarm.coordinates.longitude]);
      setMapZoom(15);
    }
  };

  const handleWestBengalOverview = () => {
    setMapCenter([22.9868, 87.8550]);
    setMapZoom(7);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Location detection is not supported by this browser.');
      return;
    }
    setGeoStatus('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus(`Location found: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`);
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setMapZoom(14);
      },
      () => {
        setGeoStatus('Location access was denied. Showing the selected plot.');
      },
      { timeout: 8000 }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const matched = farms.find(
      f =>
        f.name.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        (f.village && f.village.toLowerCase().includes(q)) ||
        (f.block && f.block.toLowerCase().includes(q))
    );
    if (matched) {
      if (onSelectFarm) onSelectFarm(matched.id);
      setMapCenter([matched.coordinates.latitude, matched.coordinates.longitude]);
      setMapZoom(15);
    }
  };

  const currentNdvi = selectedTemporalStep?.ndvi ?? satelliteData?.vegetationNdvi?.currentNdvi ?? 0.68;
  const ndviColor =
    currentNdvi >= 0.65
      ? '#2E7D32'
      : currentNdvi >= 0.45
        ? '#A5D6A7'
        : currentNdvi >= 0.3
          ? '#DCC9A3'
          : '#C62828';

  const activeLayerConfig = BASE_LAYERS[baseLayer] || BASE_LAYERS.satellite;

  const wrapperStyle = isFullscreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--color-background)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      };

  return (
    <div style={wrapperStyle} data-testid="krishi-mitra-farm-map">
      {/* Top map toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          padding: '0.65rem 0.9rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        {/* Base Layer Switcher */}
        <div className="flex items-center gap-1 flex-wrap">
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: '0.35rem', fontWeight: 600 }}>
            Base Map:
          </span>
          {Object.values(BASE_LAYERS).map(layer => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setBaseLayer(layer.id)}
              className={`btn btn-sm ${baseLayer === layer.id ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.76rem' }}
            >
              {layer.id === 'satellite' ? 'Satellite' : layer.id === 'street' ? 'Street' : 'Terrain'}
            </button>
          ))}
        </div>

        {/* Search & Quick Jump */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1" style={{ flex: '1 1 200px', maxWidth: '300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search farm, district, village..."
              aria-label="Search farm or district on map"
              style={{
                width: '100%',
                padding: '0.35rem 0.65rem 0.35rem 1.85rem',
                fontSize: '0.78rem',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)'
              }}
            />
            <Search size={13} style={{ position: 'absolute', left: '0.55rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-primary)' }} />
          </div>
          <button type="submit" className="btn btn-sm btn-ghost" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
            Go
          </button>
        </form>

        {/* Viewport & GPS Controls */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={handleResetToFarm}
            className="btn btn-sm btn-ghost"
            title="Center on Selected Farm Plot"
          >
            <RotateCcw size={13} />
            <span>Focus Plot</span>
          </button>
          <button
            type="button"
            onClick={handleWestBengalOverview}
            className="btn btn-sm btn-ghost"
            title="Zoom to West Bengal Regional Overview"
          >
            <Globe size={13} />
            <span>WB Overview</span>
          </button>
          <button
            type="button"
            onClick={handleLocateUser}
            className="btn btn-sm btn-ghost"
            title="Detect Current GPS Coordinates"
          >
            <Navigation size={13} />
            <span>My GPS</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-sm btn-secondary"
            aria-label={isFullscreen ? 'Exit Fullscreen Map' : 'Enter Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Map layer controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          padding: '0.55rem 0.9rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.76rem'
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ color: 'var(--color-primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Layers size={14} />
            Map Layers:
          </span>

          {[
            { key: 'boundaries', label: 'Plot Boundaries', color: '#2E7D32' },
            { key: 'ndvi', label: `Crop Greenness (${currentNdvi})`, color: '#A5D6A7' },
            { key: 'soilMoisture', label: 'Soil Moisture', color: '#78847B' },
            { key: 'rainfall', label: 'Rainfall', color: '#2E7D32' },
            { key: 'salinityZone', label: 'Salinity Zone', color: '#DCC9A3' }
          ].map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleLayer(item.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: layers[item.key] ? `1px solid ${item.color}` : '1px solid var(--color-border)',
                background: layers[item.key] ? 'var(--color-background)' : 'transparent',
                color: layers[item.key] ? 'var(--color-text)' : 'var(--color-text-muted)',
                fontWeight: layers[item.key] ? 600 : 400,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Opacity Slider */}
        <div className="flex items-center gap-2">
          <Eye size={13} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ color: 'var(--color-text-muted)' }}>Layer opacity:</span>
          <input
            type="range"
            min="0.2"
            max="0.9"
            step="0.05"
            value={overlayOpacity}
            onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
            aria-label="Map layer opacity"
            style={{ width: '80px', accentColor: 'var(--color-primary)' }}
          />
          <span className="tabular-nums" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            {Math.round(overlayOpacity * 100)}%
          </span>
        </div>
      </div>

      {geoStatus && (
        <div style={{ fontSize: '0.76rem', color: 'var(--color-primary)', padding: '0.3rem 0.65rem', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-sm)' }}>
          {geoStatus}
        </div>
      )}

      {tileWarning && (
        <div style={{ fontSize: '0.76rem', color: 'var(--color-warning)', padding: '0.35rem 0.65rem', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-sm)' }}>
          Some map tiles are loading slowly. Plot boundaries and local data remain available.
        </div>
      )}

      {/* Main Interactive Map Canvas */}
      <div
        style={{
          height: isFullscreen ? 'calc(100vh - 190px)' : height,
          width: '100%',
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            key={activeLayerConfig.id}
            url={activeLayerConfig.url}
            attribution={activeLayerConfig.attribution}
          />
          <MapViewportController
            center={mapCenter}
            zoom={mapZoom}
            onTileError={setTileWarning}
          />

          {/* 1. Coastal Salinity Risk Corridor Overlay */}
          {layers.salinityZone && (
            <Polygon
              positions={SUNDARBANS_SALINITY_CORRIDOR}
              pathOptions={{
                color: '#DCC9A3',
                weight: 1.5,
                dashArray: '6 4',
                fillColor: '#DCC9A3',
                fillOpacity: overlayOpacity * 0.25
              }}
            >
              <Popup>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                  <strong style={{ color: '#B07525' }}>Sundarbans Coastal Salinity Zone</strong>
                  <div>Dry-Season Soil EC Screening: 4.0 – 8.0+ dS/m</div>
                  <div style={{ color: '#78847B', fontSize: '0.72rem', marginTop: '4px' }}>
                    Source: ICAR-CSSRI Canning &amp; SRTM Lowland Delta Boundary
                  </div>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* 2. Regional Soil Moisture Estimate */}
          {layers.soilMoisture && activeFarm?.coordinates && (
            <Circle
              center={[activeFarm.coordinates.latitude, activeFarm.coordinates.longitude]}
              radius={4500}
              pathOptions={{
                color: '#78847B',
                weight: 1.5,
                dashArray: '4 4',
                fillColor: '#78847B',
                fillOpacity: overlayOpacity * 0.18
              }}
            >
              <Popup>
                <div style={{ fontSize: '0.8rem' }}>
                  <strong style={{ color: '#2E7D32' }}>Satellite Soil Moisture Estimate (~9 km area)</strong>
                  <div>Surface: {satelliteData?.smapSoilMoisture?.surfaceMoisture || '0.28 cm³/cm³'}</div>
                  <div>Root-Zone: {satelliteData?.smapSoilMoisture?.rootZoneMoisture || '0.32 cm³/cm³'}</div>
                </div>
              </Popup>
            </Circle>
          )}

          {/* 3. Regional Rainfall Estimate */}
          {layers.rainfall && activeFarm?.coordinates && (
            <Circle
              center={[activeFarm.coordinates.latitude, activeFarm.coordinates.longitude]}
              radius={5000}
              pathOptions={{
                color: '#2E7D32',
                weight: 1.5,
                fillColor: '#2E7D32',
                fillOpacity: overlayOpacity * 0.22
              }}
            >
              <Popup>
                <div style={{ fontSize: '0.8rem' }}>
                  <strong style={{ color: '#2E7D32' }}>Satellite Rainfall Estimate (~10 km area)</strong>
                  <div>7-Day Accumulation: {satelliteData?.gpmRainfall?.sevenDayAccumulation ?? 2.4} mm</div>
                  <div>30-Day Total: {satelliteData?.gpmRainfall?.thirtyDayAccumulation ?? 58.2} mm</div>
                </div>
              </Popup>
            </Circle>
          )}

          {/* 4. All Farm Markers & Plot Boundary Polygons */}
          {farms.map(farm => {
            const isSelected = activeFarm && farm.id === activeFarm.id;
            const isCoastal = String(farm.district).includes('24 Parganas') || String(farm.id).includes('gosaba');
            const poly = farm.boundaryPolygon || [
              [farm.coordinates.latitude + 0.0018, farm.coordinates.longitude - 0.0022],
              [farm.coordinates.latitude + 0.0018, farm.coordinates.longitude + 0.0022],
              [farm.coordinates.latitude - 0.0018, farm.coordinates.longitude + 0.0022],
              [farm.coordinates.latitude - 0.0018, farm.coordinates.longitude - 0.0022]
            ];

            return (
              <React.Fragment key={farm.id}>
                {(layers.boundaries || layers.ndvi) && (
                  <Polygon
                    positions={poly}
                    pathOptions={{
                      color: isSelected ? '#2E7D32' : '#78847B',
                      weight: isSelected ? 3 : 2,
                      fillColor: layers.ndvi ? (isSelected ? ndviColor : '#2E7D32') : '#2E7D32',
                      fillOpacity: layers.ndvi ? overlayOpacity : 0.25
                    }}
                    eventHandlers={{
                      click() {
                        if (onSelectFarm && !isSelected) onSelectFarm(farm.id);
                      }
                    }}
                  />
                )}

                <Marker
                  position={[farm.coordinates.latitude, farm.coordinates.longitude]}
                  icon={createFarmIcon(isSelected, isCoastal)}
                  eventHandlers={{
                    click() {
                      if (onSelectFarm && !isSelected) onSelectFarm(farm.id);
                    }
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '210px', fontSize: '0.8rem', lineHeight: 1.45 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#2E7D32', marginBottom: '2px' }}>
                        {farm.name}
                      </div>
                      <div style={{ color: '#78847B', fontWeight: 600, marginBottom: '6px' }}>
                        {farm.village ? `${farm.village}, ` : ''}{farm.district}, West Bengal
                      </div>
                      <div className="tabular-nums" style={{ fontSize: '0.74rem', color: '#78847B' }}>
                        <div><strong>Coords:</strong> {farm.coordinates.latitude.toFixed(4)}°N, {farm.coordinates.longitude.toFixed(4)}°E</div>
                        <div><strong>Area:</strong> {farm.area} {farm.areaUnit} ({farm.areaInAcres} Acres)</div>
                        <div><strong>Crop:</strong> {farm.mainCrop}</div>
                        <div><strong>Soil:</strong> {farm.soilType}</div>
                      </div>
                      {!isSelected && onSelectFarm && (
                        <button
                          type="button"
                          onClick={() => onSelectFarm(farm.id)}
                          className="btn btn-sm btn-primary"
                          style={{ width: '100%', marginTop: '8px', padding: '0.3rem 0.5rem', fontSize: '0.74rem' }}
                        >
                          Switch to This Farm
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Bottom crop greenness legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            zIndex: 500,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.74rem'
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>
              Crop Greenness:
            </span>
            <div className="flex items-center gap-1">
              {[
                { val: 'Low', color: '#C62828' },
                { val: 'Fair', color: '#B07525' },
                { val: 'Good', color: '#DCC9A3' },
                { val: 'Healthy', color: '#2E7D32' }
              ].map(s => (
                <span key={s.val} className="flex items-center gap-1" style={{ marginRight: '0.4rem' }}>
                  <span style={{ width: 14, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>{s.val}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="tabular-nums" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Plot: {activeCoords[0].toFixed(4)}°N, {activeCoords[1].toFixed(4)}°E
          </div>
        </div>
      </div>
    </div>
  );
}
