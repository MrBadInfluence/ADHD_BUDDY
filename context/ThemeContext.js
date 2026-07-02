import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [schemeName, setSchemeName] = useState('Sage');
  const [mode, setModeState] = useState('device'); // 'light' | 'dark' | 'device'

  useEffect(() => {
    AsyncStorage.multiGet(['theme_scheme', 'theme_mode']).then((pairs) => {
      const [scheme, themeMode] = pairs;
      if (scheme[1]) setSchemeName(scheme[1]);
      if (themeMode[1]) setModeState(themeMode[1]);
    });
  }, []);

  const isDark = mode === 'device' ? systemScheme === 'dark' : mode === 'dark';

  const colors = useMemo(() => {
    const scheme = themes[schemeName] ?? themes.Sage;
    return isDark ? scheme.dark : scheme.light;
  }, [schemeName, isDark]);

  const setScheme = async (name) => {
    setSchemeName(name);
    await AsyncStorage.setItem('theme_scheme', name);
  };

  const setMode = async (m) => {
    setModeState(m);
    await AsyncStorage.setItem('theme_mode', m);
  };

  const value = useMemo(
    () => ({ colors, schemeName, mode, setScheme, setMode, isDark }),
    [colors, schemeName, mode, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useColors() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useColors must be used inside ThemeProvider');
  return ctx.colors;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
