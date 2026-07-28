// Decodifica el "payload" de un JWT sin validar la firma (eso ya lo hizo
// el backend) -- solo para leer datos como el userId ("sub") del lado del
// cliente. Base64 decodificado a mano porque `atob` no esta garantizado
// en el entorno de React Native.

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Decode(input: string): string {
  const clean = input.replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '');
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export function decodeJwtPayload(token: string): { sub?: string; role?: string; organizationId?: number } | null {
  try {
    const payloadSegment = token.split('.')[1];
    const decoded = base64Decode(payloadSegment);
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
