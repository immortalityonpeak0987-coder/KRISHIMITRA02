import React, { createContext, useContext, useState, useEffect } from 'react';
import { farmService } from '../services/farmService';

const FarmContext = createContext();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function normalizeFarmRecord(f) {
  if (!f) return null;
  const lat = Number(f.latitude ?? f.coordinates?.latitude ?? 23.2324);
  const lng = Number(f.longitude ?? f.coordinates?.longitude ?? 87.8615);

  let monthlyRotation = f.monthlyRotation ? { ...f.monthlyRotation } : null;
  if (!monthlyRotation && Array.isArray(f.currentRotation)) {
    monthlyRotation = {};
    MONTHS.forEach((m, i) => {
      const entry = f.currentRotation.find((item) => item.month === m) || f.currentRotation[i];
      monthlyRotation[m] = entry?.crop || 'Fallow';
    });
  }
  if (!monthlyRotation) {
    monthlyRotation = {
      Jan: 'Potato',
      Feb: 'Potato',
      Mar: 'Sesame',
      Apr: 'Sesame',
      May: 'Fallow',
      Jun: 'Aman Paddy',
      Jul: 'Aman Paddy',
      Aug: 'Aman Paddy',
      Sep: 'Aman Paddy',
      Oct: 'Aman Paddy',
      Nov: 'Potato',
      Dec: 'Potato'
    };
  }

  const currentRotation = Array.isArray(f.currentRotation)
    ? f.currentRotation
    : MONTHS.map((m) => ({
        month: m,
        crop: monthlyRotation[m] || 'Fallow',
        stage: monthlyRotation[m] === 'Fallow' ? 'Resting' : 'Scheduled'
      }));

  return {
    ...f,
    latitude: lat,
    longitude: lng,
    coordinates: { latitude: lat, longitude: lng },
    currentCrop: f.currentCrop || f.mainCrop || 'Aman Paddy',
    mainCrop: f.mainCrop || f.currentCrop || 'Aman Paddy',
    irrigationSource: f.irrigationSource || f.farmType || 'Canal & Tubewell',
    monthlyRotation,
    currentRotation
  };
}

export function FarmProvider({ children }) {
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(true);
  const [unitPreference, setUnitPreference] = useState('Bigha');
  const [language, setLanguage] = useState('en'); // 'en' | 'bn'
  const [experienceMode, setExperienceMode] = useState('farmer'); // 'farmer' | 'institutional'
  const [institutionalRole, setInstitutionalRole] = useState('fpo'); // 'fpo' | 'officer' | 'ngo'
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'info',
      title: 'Weather & Soil Guide Ready',
      message:
        'Viewing Purba Bardhaman farm plot. Switch between light and dark modes anytime from the header.',
      timestamp: 'Just now'
    },
    {
      id: 'notif-2',
      type: 'success',
      title: 'Weather & Soil Moisture Updates Loaded',
      message:
        '10-year rainfall patterns, soil moisture estimates, and crop health maps are ready for your plot.',
      timestamp: 'Today'
    }
  ]);

  const loadFarms = async () => {
    setIsLoading(true);
    try {
      const rawLoaded = await farmService.getAllFarms();
      const loaded = (rawLoaded || []).map(normalizeFarmRecord).filter(Boolean);
      setFarms(loaded);
      setBackendConnected(loaded.length > 0);
      if (loaded.length > 0 && !activeFarm) {
        setActiveFarm(loaded[0]);
      } else if (activeFarm) {
        const refreshedActive = loaded.find((f) => f.id === activeFarm.id) || loaded[0];
        setActiveFarm(refreshedActive);
      }
    } catch (err) {
      console.error('Failed to load farms:', err);
      setBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const switchFarm = (farmId) => {
    const selected = farms.find((f) => f.id === farmId);
    if (selected) {
      setActiveFarm(selected);
      setNotifications((prev) => [
        {
          id: `switch-${Date.now()}`,
          type: 'info',
          title: `Switched to ${selected.name}`,
          message: `Active district: ${selected.district} (${selected.agroClimaticZone || 'West Bengal'})`,
          timestamp: 'Just now'
        },
        ...prev.slice(0, 4)
      ]);
    }
  };

  const addFarm = async (farmData) => {
    const rawSaved = await farmService.registerFarm(farmData);
    const saved = normalizeFarmRecord(rawSaved);
    setFarms((prev) => [saved, ...prev.filter((f) => f.id !== saved.id)]);
    setActiveFarm(saved);
    setNotifications((prev) => [
      {
        id: `reg-${Date.now()}`,
        type: 'success',
        title: 'New Farm Registered (Live Session)',
        message: `${saved.name} in ${saved.district} (${saved.latitude.toFixed(4)}°N, ${saved.longitude.toFixed(4)}°E) is now active.`,
        timestamp: 'Just now'
      },
      ...prev.slice(0, 4)
    ]);
    return saved;
  };

  const updateActiveFarmRotation = async (newRotation) => {
    if (!activeFarm) return;
    const updatedMap = {};
    newRotation.forEach((item) => {
      if (item?.month) updatedMap[item.month] = item.crop || 'Fallow';
    });
    const optimistic = normalizeFarmRecord({
      ...activeFarm,
      currentRotation: newRotation,
      monthlyRotation: updatedMap
    });
    setActiveFarm(optimistic);
    setFarms((prev) => prev.map((f) => (f.id === activeFarm.id ? optimistic : f)));
    try {
      await farmService.updateFarm(activeFarm.id, { currentRotation: newRotation });
    } catch (e) {
      console.warn('Could not persist rotation update to backend:', e.message);
    }
  };

  const formatArea = (farmObj) => {
    if (!farmObj) return '';
    const baseBigha =
      farmObj.areaUnit === 'Bigha'
        ? Number(farmObj.area)
        : farmObj.areaUnit === 'Acre'
        ? Number(farmObj.area) * 3.025
        : Number(farmObj.area) * 7.475;

    if (unitPreference === 'Acre') {
      return `${(baseBigha * 0.3306).toFixed(2)} Acre`;
    }
    if (unitPreference === 'Hectare') {
      return `${(baseBigha * 0.1338).toFixed(2)} Ha`;
    }
    return `${baseBigha.toFixed(1)} Bigha`;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : prev === 'bn' ? 'hi' : 'en'));
  };

  // Farmer-friendly agricultural glossary (Bengali & Hindi)
  const AGRICULTURE_GLOSSARY = {
    'Rainfall Difference from Usual': 'স্বাভাবিকের তুলনায় বৃষ্টিপাতের পার্থক্য',
    'Estimated Moisture in the Soil': 'মাটিতে আনুমানিক আর্দ্রতা',
    'How Green and Healthy the Crop Looks': 'ফসলের সবুজতা ও স্বাস্থ্য',
    'Where this information comes from': 'এই তথ্যের উৎস',
    'What it helps us understand': 'এটি আমাদের কী বুঝতে সাহায্য করে',
    'Area covered by this data': 'এই তথ্যের আওতাধীন এলাকা',
    'Dates covered': 'তথ্যের সময়কাল',
    'Learn more': 'আরও জানুন',
    'My Farm Recovery Progress': 'আমার খামার পুনরুদ্ধার অগ্রগতি',
    'Try a Soil Test': 'মাটি পরীক্ষা করে দেখুন'
  };

  const HINDI_GLOSSARY = {
    'Home': 'होम',
    'My Farm': 'मेरा खेत',
    'Weather & Alerts': 'मौसम और अलर्ट',
    'Crop Planner': 'फसल योजना',
    'About': 'परिचय',
    'Settings': 'सेटिंग्स',
    'Soil Test & Risk Check': 'मिट्टी जांच और जोखिम',
    'My Farm Recovery Progress': 'खेत रिकवरी प्रगति',
    'Weather & Seasonal Insights': 'मौसम और मौसमी जानकारी',
    'Crop Planner & 12-Month Calendar': 'फसल योजना और 12-माह कैलेंडर'
  };

  const t = (enText, bnText, hiText) => {
    if (language === 'bn') {
      return bnText || AGRICULTURE_GLOSSARY[enText] || enText;
    }
    if (language === 'hi') {
      return hiText || HINDI_GLOSSARY[enText] || enText;
    }
    return enText;
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <FarmContext.Provider
      value={{
        farms,
        activeFarm,
        isLoading,
        backendConnected,
        switchFarm,
        addFarm,
        updateActiveFarmRotation,
        refreshFarms: loadFarms,
        unitPreference,
        setUnitPreference,
        formatArea,
        language,
        setLanguage,
        toggleLanguage,
        t,
        experienceMode,
        setExperienceMode,
        institutionalRole,
        setInstitutionalRole,
        notifications,
        dismissNotification
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}
