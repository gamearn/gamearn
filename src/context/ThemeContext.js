import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_THEME, LIGHT_THEME } from '../theme/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@gamearn_theme').then((val) => {
      if (val === 'light') setIsDark(false);
      else setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    await setTheme(!isDark);
  };

  const setTheme = async (nextDark) => {
    const next = !!nextDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem('@gamearn_theme', next ? 'dark' : 'light');
    } catch {
      // Local cache is best-effort; the server preference is the source of truth.
    }
  };

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
