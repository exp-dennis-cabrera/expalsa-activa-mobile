import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Referencia global al navegador. Permite navegar desde codigo que corre
 * fuera de un componente de React -- concretamente, desde el listener que
 * se dispara cuando el usuario toca una notificacion push con la app
 * cerrada o en segundo plano. Mismo proposito que la funcion navigate()
 * del real.
 */
export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}
