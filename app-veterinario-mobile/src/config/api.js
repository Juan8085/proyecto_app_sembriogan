import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// URL oficial del Backend en la nube (Render)
export const PRODUCTION_API_URL = 'https://sembriogan-backend.onrender.com';

// Detecta automáticamente la IP de la computadora desde Metro Bundler (Expo)
export const getDevServerHost = () => {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
      if (address && address !== 'localhost' && address !== '127.0.0.1' && address !== '10.0.2.2') {
        return address;
      }
    }
  } catch (e) {}
  return null;
};

// URL por defecto para la app: Servidor en producción (Render)
export const getDefaultApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/$/, '');
  }
  return PRODUCTION_API_URL;
};

export let API_URL = getDefaultApiUrl();

// Inicializar desde almacenamiento local (migra IPs locales obsoletas a Render)
export const initApiUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem('custom_api_url');
    const defaultUrl = getDefaultApiUrl();

    if (saved && saved.trim()) {
      const cleanSaved = saved.trim().replace(/\/$/, '');
      // Si la URL guardada era una IP local de desarrollo (ej: 192.168.1.xxx) que ya no conecta,
      // migrar automáticamente a la nube oficial en Render
      const isLocalIp = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+|localhost):3000$/i.test(cleanSaved);
      if (isLocalIp) {
        console.log('🔄 [Sembriogan Mobile] Migrando automáticamente a Backend en la nube:', defaultUrl);
        API_URL = defaultUrl;
        await AsyncStorage.setItem('custom_api_url', defaultUrl);
      } else {
        API_URL = cleanSaved;
      }
    } else {
      API_URL = defaultUrl;
    }
  } catch (e) {
    API_URL = getDefaultApiUrl();
  }
  return API_URL;
};

// Carga inmediata
initApiUrl();

export const setCustomApiUrl = async (newUrl) => {
  try {
    if (!newUrl || !newUrl.trim()) {
      await AsyncStorage.removeItem('custom_api_url');
      API_URL = getDefaultApiUrl();
    } else {
      const clean = newUrl.trim().replace(/\/$/, '');
      await AsyncStorage.setItem('custom_api_url', clean);
      API_URL = clean;
    }
    console.log('📡 [Sembriogan Mobile] API_URL actualizada a:', API_URL);
    return API_URL;
  } catch (e) {
    console.error('Error guardando API_URL:', e);
    return API_URL;
  }
};

export const getApiUrl = () => API_URL;

export default {
  API_URL,
  getDefaultApiUrl,
  initApiUrl,
  setCustomApiUrl,
  getApiUrl
};
