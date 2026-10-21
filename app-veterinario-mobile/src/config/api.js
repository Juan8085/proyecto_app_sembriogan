import { Platform, NativeModules } from 'react-native';

// Detecta automáticamente la IP de tu computadora desde el bundler de Metro (Expo).
// Esto evita tener que modificar el código cada vez que cambias de red (casa, SENA, datos móviles).
const getDevServerHost = () => {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
      if (address && address !== 'localhost' && address !== '127.0.0.1') {
        return address;
      }
    }
  } catch (e) {
    // Silencioso
  }
  return null;
};

const devHost = getDevServerHost();

// Si deseas conectar la app móvil a través de un túnel ngrok (ej: backend expuesto en internet):
// Coloca la URL de ngrok aquí o déjalo en null para detección automática de red local.
// Ejemplo: const NGROK_API_URL = 'https://mi-backend.ngrok-free.app';
const NGROK_API_URL = null;

export const API_URL = (() => {
  if (NGROK_API_URL) return NGROK_API_URL.replace(/\/$/, '');

  // Si detectó la IP de la computadora en la red Wi-Fi actual (Casa, SENA, etc.)
  if (devHost) {
    return `http://${devHost}:3000`;
  }

  // Fallback para emuladores
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
})();

console.log('📡 [Sembriogan Mobile] API_URL configurada:', API_URL);
