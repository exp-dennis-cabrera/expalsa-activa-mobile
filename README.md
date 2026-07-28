# Expalsa Activa — App móvil

App móvil (Android + iOS, un solo código) del sistema de mantenimiento Expalsa Activa. Construida con **React Native + Expo**, hablando con el mismo backend REST/JWT que ya usa la web.

## Alcance de esta primera versión (v1 base)

- Inicio de sesión (con opción de apuntar a un servidor propio, ver "Configurar servidor")
- Lista de Órdenes de trabajo
- Detalle de una orden, con cambio de estado
- Ajustes / cerrar sesión

**Todavía no incluye** (quedó para siguientes rondas, según lo conversado): escaneo de código de barras/NFC de Activos, Solicitudes, Medidores, Solicitud de materiales, notificaciones push, adjuntar fotos.

## Requisitos

- Node.js 18+
- Una cuenta de Expo (gratis) — [expo.dev](https://expo.dev)
- Para probar en el celular: la app **Expo Go**, descargable de Play Store / App Store

## Arrancar en desarrollo

```bash
npm install
cp .env.example .env   # y completá la URL de tu backend
npx expo start
```

Escaneá el código QR que aparece con la app **Expo Go** desde tu celular (tiene que estar en la misma red que tu computadora, o usar un backend accesible por internet).

## Apuntar a tu backend

Por defecto, la app usa la URL definida en `EXPO_PUBLIC_API_URL` (ver `.env`). Si estás probando en un emulador Android y tu backend corre en tu misma computadora, usá `http://10.0.2.2:8080` en vez de `http://localhost:8080` (Android mapea así el localhost de la PC).

También se puede cambiar la URL del servidor **desde adentro de la app**, sin recompilar: pantalla de Login → "Configurar servidor".

## Compilar el instalable (.apk / .aab)

Requiere una cuenta de Expo y tener instalado `eas-cli`:

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # genera un .apk para probar
eas build --platform android --profile production # genera el .aab para subir a Play Store
```

## Estructura

```
src/
  api/          -- clientes HTTP (auth, work orders, etc.)
  context/      -- sesión / autenticación
  navigation/   -- pilas de pantallas
  screens/      -- pantallas, organizadas por módulo
  theme/        -- colores, consistentes con la web
```
