import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// Detecta automáticamente la IP de la computadora desde Metro Bundler (Expo)
const getDevServerHost = () => {
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

const devHost = getDevServerHost();

// IP por defecto de la computadora en la red Wi-Fi
export const getDefaultApiUrl = () => {
  if (devHost) return `http://${devHost}:3000`;
  return 'http://192.168.1.107:3000';
};

export let API_URL = getDefaultApiUrl();

// Inicializar desde almacenamiento local (guarda túneles como https://xxxx.loca.lt)
export const initApiUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem('custom_api_url');
    if (saved && saved.trim()) {
      API_URL = saved.trim().replace(/\/$/, '');
      console.log('📡 [Sembriogan Mobile] API_URL personalizada cargada:', API_URL);
    } else {
      API_URL = getDefaultApiUrl();
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
