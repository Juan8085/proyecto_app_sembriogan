import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

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

// IP por defecto o URL pública de producción
export const getDefaultApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/$/, '');
  }
  const host = getDevServerHost();
  if (host) return `http://${host}:3000`;
  return 'http://192.168.1.105:3000';
};

export let API_URL = getDefaultApiUrl();

// Inicializar desde almacenamiento local (guarda túneles como https://xxxx.loca.lt)
export const initApiUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem('custom_api_url');
    const defaultUrl = getDefaultApiUrl();
    const currentHost = getDevServerHost();

    if (saved && saved.trim()) {
      const cleanSaved = saved.trim().replace(/\/$/, '');
      // Si la URL guardada es una IP local y no coincide con el host actual detectado por Metro,
      // actualizamos automáticamente a la IP detectada para que no quede bloqueada en una IP antigua
      const isLocalIp = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+):3000$/i.test(cleanSaved);
      if (isLocalIp && currentHost && !cleanSaved.includes(currentHost)) {
        console.log(`🔄 [Sembriogan Mobile] La IP local cambió a ${currentHost}. Actualizando URL...`);
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
