import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'krishi-mitra-theme';
const DEFAULT_THEME = 'system'; // 'light' | 'dark' | 'system'

export function ThemeProvider({ children }) {
  const [storedTheme, setStoredTheme] = useState(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const applyTheme = useCallback((theme) => {
    const html = document.documentElement;
    if (theme === 'system') {
      const system = getSystemTheme();
      html.setAttribute('data-theme', system);
      setResolvedTheme(system);
    } else {
      html.setAttribute('data-theme', theme);
      setResolvedTheme(theme);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setStoredTheme(saved);
      }
    } catch (e) {
      // localStorage unavailable; use default
    }
    setMounted(true);
    applyTheme(storedTheme);
  }, [storedTheme, applyTheme]);

  useEffect(() => {
    if (!mounted) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (storedTheme === 'system') {
        applyTheme('system');
      }
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [storedTheme, mounted, applyTheme]);

  const setTheme = useCallback((theme) => {
    setStoredTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // ignore
    }
    applyTheme(theme);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        storedTheme,
        setTheme,
        toggleTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
