import { MD3LightTheme } from 'react-native-paper';

// Mismos colores que el tema real de Atlas (custom-theme.ts).
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#5569ff',
    secondary: '#959be0',
    tertiary: '#9DA1A1',
    background: '#ebecf6',
    secondaryContainer: '#7b7d93',
    success: '#57CA22',
    warning: '#FFA319',
    error: '#FF1943',
    info: '#33C2FF',
    grey: '#676b6b',
    surface: '#ffffff',
  },
};
