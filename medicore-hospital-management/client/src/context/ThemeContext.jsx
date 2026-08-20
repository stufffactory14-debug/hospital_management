import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'medicore-theme';
const ThemeContext = createContext(null);
const validTheme = (value) => ['light', 'dark', 'system'].includes(value) ? value : 'system';
const systemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => validTheme(localStorage.getItem(STORAGE_KEY)));
  const [system, setSystem] = useState(systemTheme);
  const resolvedTheme = theme === 'system' ? system : theme;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setSystem(event.matches ? 'dark' : 'light');
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme: (nextTheme) => { const selected = validTheme(nextTheme); setThemeState(selected); localStorage.setItem(STORAGE_KEY, selected); },
  }), [theme, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
