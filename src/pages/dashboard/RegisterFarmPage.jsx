import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { farmService } from '../../services/farmService';
import FarmLocationPicker from '../../components/map/FarmLocationPicker';
import { ShieldCheck, ArrowRight, MapPin, Compass, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';

// West Bengal geographic bounding box
const WB_BOUNDS = {
  minLat: 21.4,
  maxLat: 27.3,
  minLng: 85.8,
  maxLng: 89.9
};

export default function RegisterFarmPage() {
  const { addFarm, t } = useFarm();
  const navigate = useNavigate();
  const districts = farmService.getDistricts();

  const [locationMethod, setLocationMethod] = useState('map');
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [confirmationMethodLabel, setConfirmationMethodLabel] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    farmerName: '',
    state: 'West Bengal',
    district: 'Purba Bardhaman',
    block: '',
    village: '',
    area: '',
    areaUnit: 'Bigha',
    farmType: 'Irrigated Alluvial',
    mainCrop: 'Aman Paddy',
    latitude: 23.2324,
    longitude: 87.8615
  });

  const [manualLatInput, setManualLatInput] = useState('');
  const [manualLngInput, setManualLngInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numArea = parseFloat(formData.area) || 0;
  let convertedAcres = 0;
  let convertedHectares = 0;
  let convertedBigha = 0;

  if (formData.areaUnit === 'Bigha') {
    convertedBigha = numArea;
    convertedAcres = (numArea * 0.3306).toFixed(2);
    convertedHectares = (numArea * 0.1338).toFixed(2);
  } else if (formData.areaUnit === 'Acre') {
    convertedAcres = numArea;
    convertedBigha = (numArea * 3.025).toFixed(2);
    convertedHectares = (numArea * 0.4047).toFixed(2);
  } else {
    convertedHectares = numArea;
    convertedBigha = (numArea * 7.475).toFixed(2);
    convertedAcres = (numArea * 2.471).toFixed(2);
  }

  const handleMapLocationSelect = (lat, lng, sourceLabel = 'Map pin selection') => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    setManualLatInput(String(lat));
    setManualLngInput(String(lng));
    setLocationConfirmed(true);
    setConfirmationMethodLabel(sourceLabel);
    setErrors((prev) => ({ ...prev, coordinates: undefined }));
  };

  const handleManualCoordChange = (field, rawVal) => {
    if (field === 'latitude') {
      setManualLatInput(rawVal);
      const parsed = parseFloat(rawVal);
      if (!Number.isNaN(parsed)) {
        setFormData((prev) => ({ ...prev, latitude: parsed }));
      }
    } else {
      setManualLngInput(rawVal);
      const parsed = parseFloat(rawVal);
      if (!Number.isNaN(parsed)) {
        setFormData((prev) => ({ ...prev, longitude: parsed }));
      }
    }
    const latCheck = field === 'latitude' ? parseFloat(rawVal) : parseFloat(manualLatInput);
    const lngCheck = field === 'longitude' ? parseFloat(rawVal) : parseFloat(manualLngInput);
    if (!Number.isNaN(latCheck) && !Number.isNaN(lngCheck)) {
      setLocationConfirmed(true);
      setConfirmationMethodLabel('Manual coordinate entry');
      setErrors((prev) => ({ ...prev, coordinates: undefined }));
    }
  };

  const validate = () => {
    const err = {};
    if (!formData.name.trim()) {
      err.name = 'Please enter a name for your farm plot.';
    }
    if (!formData.district) {
      err.district = 'Please select your district.';
    }
    if (!formData.area || numArea <= 0) {
      err.area = 'Please enter a valid farm area greater than 0.';
    }

    const lat = Number(formData.latitude);
    const lng = Number(formData.longitude);

    if (!locationConfirmed) {
      err.coordinates =
        locationMethod === 'map'
          ? 'Please click on the map, drag the pin, use GPS, or confirm the selected map pin.'
          : 'Please enter your farm Latitude and Longitude coordinates manually.';
    } else if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < WB_BOUNDS.minLat ||
      lat > WB_BOUNDS.maxLat ||
      lng < WB_BOUNDS.minLng ||
      lng > WB_BOUNDS.maxLng
    ) {
      err.coordinates = `Coordinates must be inside the service area (${WB_BOUNDS.minLat}°N–${WB_BOUNDS.maxLat}°N, ${WB_BOUNDS.minLng}°E–${WB_BOUNDS.maxLng}°E).`;
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        area: numArea,
        areaInAcres: parseFloat(convertedAcres) || numArea,
        coordinates: {
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude)
        },
        soilType: formData.district.includes('24 Parganas')
          ? 'Coastal Saline Alluvium (Clay)'
          : formData.district.includes('Bankura') || formData.district.includes('Purulia')
          ? 'Red & Lateritic Sandy Loam'
          : 'Gangetic Alluvium (Clay Loam)'
      };

      await addFarm(payload);
      navigate('/app/overview');
    } catch (err) {
      console.error('Registration failed:', err);
      setErrors({ submit: err.message || 'Could not register farm plot.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.35rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          {t('Register New Farm Plot', 'নতুন খামার নিবন্ধন করুন')}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
          {t('Choose how to set your farm location: pick your plot on the interactive map or enter coordinates manually.', 'আপনার খামারের অবস্থান সেট করুন: ইন্টারঅ্যাক্টিভ মানচিত্রে প্লট বেছে নিন অথবা ম্যানুয়ালি স্থানাঙ্ক লিখুন।')}
        </p>
      </div>

      {/* Method Selector */}
      <div className="card" style={{ marginBottom: '1.35rem', padding: '1rem 1.25rem', border: '1px solid var(--color-border)' }}>
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            marginBottom: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {t('Choose How to Provide Your Farm Location:', 'খামারের অবস্থান প্রদানের পদ্ধতি বেছে নিন:')}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0.85rem'
          }}
        >
          <button
            type="button"
            onClick={() => setLocationMethod('map')}
            style={{
              textAlign: 'left',
              padding: '0.9rem 1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: locationMethod === 'map' ? 'var(--color-success-bg)' : 'var(--color-surface)',
              border: locationMethod === 'map' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
              <Compass size={18} style={{ color: 'var(--color-primary)' }} />
              <strong style={{ fontSize: '0.95rem' }}>{t('Method 1 — Select on map', 'পদ্ধতি ১ — মানচিত্রে বেছে নিন')}</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {t('Click on the interactive map, drag the farm pin, or use GPS.', 'ইন্টারঅ্যাক্টিভ মানচিত্রে ক্লিক করুন, পিন টেনে ঘুরান, অথবা GPS ব্যবহার করুন।')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setLocationMethod('manual');
              if (!manualLatInput && locationConfirmed) {
                setManualLatInput(String(formData.latitude));
                setManualLngInput(String(formData.longitude));
              }
            }}
            style={{
              textAlign: 'left',
              padding: '0.9rem 1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: locationMethod === 'manual' ? 'var(--color-success-bg)' : 'var(--color-surface)',
              border: locationMethod === 'manual' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
              <Edit3 size={18} style={{ color: 'var(--color-primary)' }} />
              <strong style={{ fontSize: '0.95rem' }}>{t('Method 2 — Enter manually', 'পদ্ধতি ২ — ম্যানুয়ালি লিখুন')}</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              {t('Type Latitude & Longitude with District, Block, and Village.', 'অক্ষাংশ ও দ্রাঘিমাংশ এবং জেলা, ব্লক ও গ্রাম লিখুন।')}
            </p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}
        >
          {/* Column 1: Farm Details */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.15rem' }}>
              <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
              <span>{t('1. Farm & Crop Details', '১. খামার ও ফসলের বিবরণ')}</span>
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="farm-name-input">
                {t('Farm / Plot Name *', 'খামার / প্লটের নাম *')}
              </label>
              <input
                id="farm-name-input"
                type="text"
                className="form-input"
                placeholder="e.g., Dakshin Math Plot #4"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="farmer-name-input">
                {t('Farmer Name (Optional)', 'কৃষকের নাম (ঐচ্ছিক)')}
              </label>
              <input
                id="farmer-name-input"
                type="text"
                className="form-input"
                placeholder="e.g., Animesh Mondal"
                value={formData.farmerName}
                onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('State', 'রাজ্য')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.state}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="district-select">
                  {t('District *', 'জেলা *')}
                </label>
                <select
                  id="district-select"
                  className="form-select"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.district && <span className="form-error">{errors.district}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="block-input">
                  {t('Block / Tehsil', 'ব্লক')}
                </label>
                <input
                  id="block-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Memari / Gosaba"
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="village-input">
                  {t('Village / Gram Panchayat', 'গ্রাম / গ্রাম পঞ্চায়েত')}
                </label>
                <input
                  id="village-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Bagila"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                />
              </div>
            </div>

            {/* Area */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="area-input">
                    {t('Farm Size / Area *', 'খামারের আকার / জমি *')}
                  </label>
                  <input
                    id="area-input"
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-input"
                    placeholder="e.g., 4.5"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                  {errors.area && <span className="form-error">{errors.area}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="unit-select">
                    {t('Area Unit', 'একক')}
                  </label>
                  <select
                    id="unit-select"
                    className="form-select"
                    value={formData.areaUnit}
                    onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value })}
                  >
                    <option value="Bigha">Bigha (বিঘা)</option>
                    <option value="Acre">Acre</option>
                    <option value="Hectare">Hectare</option>
                  </select>
                </div>
              </div>

              {numArea > 0 && (
                <div style={{ background: 'var(--color-success-bg)', border: '1px solid rgba(46, 125, 50, 0.3)', padding: '0.55rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                  <strong>{t('Converted Area:', 'প্রতিস্থাপিত আকার:')}</strong> {convertedBigha} Bigha ≈ {convertedAcres} Acres ({convertedHectares} Hectares)
                </div>
              )}
            </div>

            {/* Farm Type & Crop */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="farm-type-select">
                  {t('Land Type', 'ভूमির ধরণ')}
                </label>
                <select
                  id="farm-type-select"
                  className="form-select"
                  value={formData.farmType}
                  onChange={(e) => setFormData({ ...formData, farmType: e.target.value })}
                >
                  <option value="Irrigated Alluvial">{t('Irrigated Alluvial', 'সেচयुक्त অনাদি')}</option>
                  <option value="Rainfed Medium Land">{t('Rainfed Medium Land', 'বর্ষা নির্ভর মধ্যম জমি')}</option>
                  <option value="Coastal Saline Lowland">{t('Coastal Saline Lowland', 'তটবর্তি লবণাক্ত নিম্নভূমি')}</option>
                  <option value="Red Laterite Upland">{t('Red Laterite Upland', 'লাল বাভ」・「উদ্ভব')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="main-crop-select">
                  {t('Current Crop', 'বর্তমান ফসল')}
                </label>
                <select
                  id="main-crop-select"
                  className="form-select"
                  value={formData.mainCrop}
                  onChange={(e) => setFormData({ ...formData, mainCrop: e.target.value })}
                >
                  <option value="Aman Paddy">Aman Paddy (Kharif)</option>
                  <option value="Boro Paddy">Boro Paddy (Summer)</option>
                  <option value="Potato">Potato (Rabi)</option>
                  <option value="Mustard">Mustard (Rabi)</option>
                  <option value="Jute">Jute (Pre-Kharif)</option>
                  <option value="Sesame">Sesame / Til</option>
                  <option value="Pulses">Pulses (Moong / Lentil)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column 2: Location */}
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>
                {locationMethod === 'map'
                  ? t('2. Select Location on Map', '২. মানচিত্রে অবস্থান বেছে নিন')
                  : t('2. Enter Coordinates Manually', '২. ম্যানুয়ালি স্থানাঙ্ক লিখুন')}
              </h3>
              {locationConfirmed ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={12} />
                  <span>{t('CONFIRMED', 'নিশ্চিত')}</span>
                </span>
              ) : (
                <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={12} />
                  <span>{t('AWAITING CONFIRMATION', 'নিশ্চিতকরণ অপেক্ষা করছে')}</span>
                </span>
              )}
            </div>

            {locationMethod === 'map' ? (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.85rem' }}>
                  {t('Click anywhere on the map to place your farm marker, drag the marker to adjust, or use GPS.', 'মানচিত্রে যেকোনো জায়গায় ক্লিক করে আপনার খামারের মার্কার স্থাপন করুন, মার্কার টেনে সমন্বয় করুন, অথবা GPS ব্যবহার করুন।')}
                </p>

                <FarmLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  district={formData.district}
                  onLocationChange={(lat, lng, sourceLabel) =>
                    handleMapLocationSelect(lat, lng, sourceLabel || 'Interactive map pin')
                  }
                />

                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.75rem',
                    background: locationConfirmed ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                    border: locationConfirmed
                      ? '1px solid rgba(46, 125, 50, 0.38)'
                      : '1px solid rgba(176, 117, 37, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ fontSize: '0.79rem', color: 'var(--color-text)' }}>
                    {locationConfirmed ? (
                      <>
                        <strong style={{ color: 'var(--color-primary)' }}>✓ {t('Farm Pin Confirmed:', 'খামার পিন নিশ্চিত:')}</strong>{' '}
                        {Number(formData.latitude).toFixed(4)}°N, {Number(formData.longitude).toFixed(4)}°E
                        {confirmationMethodLabel ? ` (${confirmationMethodLabel})` : ''}
                      </>
                    ) : (
                      <>
                        <strong style={{ color: '#B07525' }}>{t('Action Needed:', 'পদক্ষেপ প্রয়োজন:')}</strong> {t('Click the map, use Live GPS, or press confirm to lock coordinates.', 'মানচিত্রে ক্লিক করুন, লাইভ GPS ব্যবহার করুন অথবা স্থানাঙ্ক লক করার জন্য নিশ্চিত করুন।')}
                      </>
                    )}
                  </div>
                  {!locationConfirmed && (
                    <button
                      type="button"
                      onClick={() =>
                        handleMapLocationSelect(
                          formData.latitude,
                          formData.longitude,
                          'Confirmed current map pin'
                        )
                      }
                      className="btn btn-xs btn-primary"
                    >
                      <CheckCircle2 size={13} />
                      <span>{t('Confirm Selected Map Pin', 'নির্বাচিত মানচিত্র পিন নিশ্চিত করুন')}</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    {t('Enter your farm plot’s exact Latitude and Longitude, or detect via Live GPS.', 'আপনার খামার প্লটের সঠিক অক্ষাংশ ও দ্রাঘিমাংশ লিখুন অথবা লাইভ GPS ব্যবহার করুন।')}
                  </p>
                  <button
                    type="button"
                    className="btn btn-xs btn-primary"
                    onClick={() => {
                      const fillCoords = (lat, lng, label) => {
                        const validLat = lat >= WB_BOUNDS.minLat && lat <= WB_BOUNDS.maxLat ? lat : 23.2324;
                        const validLng = lng >= WB_BOUNDS.minLng && lng <= WB_BOUNDS.maxLng ? lng : 87.8615;
                        const fixedLat = parseFloat(validLat.toFixed(5));
                        const fixedLng = parseFloat(validLng.toFixed(5));
                        setFormData((prev) => ({ ...prev, latitude: fixedLat, longitude: fixedLng }));
                        setManualLatInput(String(fixedLat));
                        setManualLngInput(String(fixedLng));
                        setLocationConfirmed(true);
                        setConfirmationMethodLabel(label);
                        setErrors((prev) => ({ ...prev, coordinates: undefined }));
                      };
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => fillCoords(pos.coords.latitude, pos.coords.longitude, 'Live GPS'),
                          () => fillCoords(formData.latitude || 23.2324, formData.longitude || 87.8615, 'Live GPS Fallback'),
                          { timeout: 4500 }
                        );
                      } else {
                        fillCoords(formData.latitude || 23.2324, formData.longitude || 87.8615, 'Live GPS Fallback');
                      }
                    }}
                  >
                    {t('Auto-Fill Live GPS', 'লাইভ GPS অটো-ফিল')}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="manual-lat-input">
                      {t('Latitude (°N) *', 'অক্ষাংশ (°উ) *')}
                    </label>
                    <input
                      id="manual-lat-input"
                      type="number"
                      step="0.0001"
                      placeholder="e.g., 23.2324"
                      className="form-input"
                      value={manualLatInput}
                      onChange={(e) => handleManualCoordChange('latitude', e.target.value)}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {t('Valid range: 21.4°N to 27.3°N', 'বৈধ সীমা: ২১.৪°উ থেকে ২৭.৩°উ')}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="manual-lng-input">
                      {t('Longitude (°E) *', 'দ্রাঘিমাংশ (°পূ) *')}
                    </label>
                    <input
                      id="manual-lng-input"
                      type="number"
                      step="0.0001"
                      placeholder="e.g., 87.8615"
                      className="form-input"
                      value={manualLngInput}
                      onChange={(e) => handleManualCoordChange('longitude', e.target.value)}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {t('Valid range: 85.8°E to 89.9°E', 'বৈধ সীমা: ৮৫.৮°পূ থেকে ৮৯.৯°পূ')}
                    </span>
                  </div>
                </div>

                {/* District Presets */}
                <div
                  style={{
                    padding: '0.85rem',
                    background: 'var(--color-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.45rem' }}>
                    {t("Don't know your exact coordinates? Select a district:", 'সঠিক স্থানাঙ্ক জানেন না? একটি জেলা নির্বাচন করুন:')}
                  </div>
                  <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                    {[
                      { label: 'Purba Bardhaman', lat: 23.2324, lng: 87.8615, dist: 'Purba Bardhaman' },
                      { label: 'Singur, Hooghly', lat: 22.8126, lng: 88.2312, dist: 'Hooghly' },
                      { label: 'Gosaba, Sundarbans', lat: 22.1648, lng: 88.8062, dist: 'South 24 Parganas' },
                      { label: 'Bishnupur, Bankura', lat: 23.0679, lng: 87.3165, dist: 'Bankura' }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, district: preset.dist, latitude: preset.lat, longitude: preset.lng }));
                          setManualLatInput(String(preset.lat));
                          setManualLngInput(String(preset.lng));
                          setLocationConfirmed(true);
                          setConfirmationMethodLabel(`District preset (${preset.dist})`);
                          setErrors((prev) => ({ ...prev, coordinates: undefined }));
                        }}
                        style={{
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.72rem',
                          borderRadius: '6px',
                          background: 'var(--color-surface)',
                          color: 'var(--color-text)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {errors.coordinates && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid rgba(198, 40, 40, 0.45)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#C62828',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                {errors.coordinates}
              </div>
            )}

            {/* Privacy */}
            <div
              className="flex items-start gap-2"
              style={{
                marginTop: '1.15rem',
                padding: '0.8rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)'
              }}
            >
              <ShieldCheck
                size={16}
                style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }}
              />
              <span>
                <strong style={{ color: 'var(--color-text)' }}>{t('Coordinate Privacy:', 'স্থানাঙ্ক গোপনীয়তা:')}</strong> {t('Plot coordinates are used only to retrieve regional weather, soil moisture, and crop health data for your farm.', 'প্লটের স্থানাঙ্ক শুধু আপনার খামারের জন্য আঞ্চলীয় আবহাওয়া, মাটির আর্দ্রতা ও ফলের স্বাস্থ্যের তথ্য সংগ্রহের জন্য ব্যবহৃত হয়।')}
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div
          className="card flex items-center justify-between"
          style={{ padding: '1.25rem 1.5rem', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--color-border)' }}
        >
          <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
            * {t('Farm name, district, area, and confirmed location are required.', 'খামারের নাম, জেলা, জমি ও নিশ্চিতすま অবস্থান আবশ্যক।')}
            {errors.submit && (
              <div style={{ color: '#C62828', marginTop: '0.25rem' }}>{errors.submit}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-lg btn-primary"
            style={{ minWidth: '240px' }}
          >
            <span>{isSubmitting ? t('Registering Plot...', 'প্লট নিবন্ধন করা হচ্ছে...') : t('Save Farm & Open Dashboard', 'খামার সেভ করুন ও ড্যাশবোর্ড খুলুন')}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
