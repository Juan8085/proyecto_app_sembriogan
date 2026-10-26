import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Decodifica de forma segura la fecha de expiración de un JWT sin librerías externas.
 * Devuelve true si el token es nulo, corrupto o si ya expiró.
 */
export const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  const clean = token.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
  if (!clean || clean === 'null' || clean === 'undefined') return true;

  try {
    const parts = clean.split('.');
    if (parts.length !== 3) return true;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonStr = '';

    if (typeof atob === 'function') {
      jsonStr = atob(base64);
    } else if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    } else {
      // Decodificador base64 puro en JS
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = base64.replace(/=+$/, '');
      let output = '';
      for (let bc = 0, bs = 0, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }
      jsonStr = output;
    }

    const payload = JSON.parse(jsonStr);
    if (!payload || !payload.exp) return false;

    // Margen de seguridad de 30 segundos
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return nowInSeconds >= (payload.exp - 30);
  } catch (e) {
    console.warn('⚠️ [Auth] No se pudo parsear el token JWT:', e.message);
    return false;
  }
};

/**
 * Obtiene el token de sesión activo (prioriza SecureStore, con respaldo en AsyncStorage)
 */
export const getToken = async () => {
  try {
    let token = await SecureStore.getItemAsync('token');
    if (!token) {
      token = await AsyncStorage.getItem('token');
    }
    if (token) {
      token = token.replace(/^["']|["']$/g, '').trim();
      if (token === 'null' || token === 'undefined') return null;
    }
    return token;
  } catch (e) {
    try {
      return await AsyncStorage.getItem('token');
    } catch {
      return null;
    }
  }
};

/**
 * Obtiene los datos del usuario logueado
 */
export const getUsuario = async () => {
  try {
    let raw = await SecureStore.getItemAsync('usuario');
    if (!raw) {
      raw = await AsyncStorage.getItem('usuario');
    }
    if (raw) {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Guarda la sesión de forma redundante para máxima compatibilidad móvil y offline
 */
export const setSession = async (token, usuario) => {
  try {
    const userStr = typeof usuario === 'string' ? usuario : JSON.stringify(usuario);
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('usuario', userStr);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('usuario', userStr);
  } catch (e) {
    console.warn('⚠️ [Auth] Error en SecureStore, guardando en AsyncStorage:', e.message);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('usuario', typeof usuario === 'string' ? usuario : JSON.stringify(usuario));
  }
};

/**
 * Cierra la sesión limpiando ambos almacenamientos
 */
export const clearSession = async () => {
  try {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('usuario');
  } catch (e) {}
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('usuario');
  } catch (e) {}
};

/**
 * Valida la vigencia de la sesión contra el endpoint del backend
 */
export const verificarSesionEnBackend = async (apiUrl) => {
  try {
    const token = await getToken();
    if (!token || isTokenExpired(token)) {
      return { activa: false, error: 'Token inexistente o expirado' };
    }

    const res = await fetch(`${apiUrl}/api/auth/verificar`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 200) {
      const data = await res.json();
      return { activa: true, usuario: data.usuario };
    } else {
      return { activa: false, error: 'Sesión no válida en el servidor' };
    }
  } catch (e) {
    // Si no hay conexión a internet, se respeta la validez local del JWT
    const token = await getToken();
    const expirado = isTokenExpired(token);
    return { activa: !expirado, offline: true };
  }
};
