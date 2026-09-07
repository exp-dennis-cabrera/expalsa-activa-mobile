import { MD3LightTheme } from 'react-native-paper';

/**
 * Colores de la marca Expalsa Activa.
 *
 * Desviacion consciente del tema de Atlas (custom-theme.ts), que usa
 * #5569ff como primario: con el logo azul marino de la marca, los botones
 * en otro azul se veian descoordinados.
 *
 * primary y error salen del propio logo, muestreados de la imagen.
 */
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#101B67',
    secondary: '#4a56a8',
    tertiary: '#9DA1A1',
    background: '#f4f5fa',
    secondaryContainer: '#7b7d93',
    success: '#57CA22',
    warning: '#FFA319',
    error: '#CC0005',
    info: '#33C2FF',
    grey: '#676b6b',
    surface: '#ffffff',
  },
};
