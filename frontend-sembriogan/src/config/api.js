// Configuración centralizada de la URL de la API y recursos multimedia
// Permite que la aplicación funcione en localhost, en red local (LAN) o conectado a la nube (Render)
// sin necesidad de modificar el código fuente al clonar o cambiar de equipo.

const envApiUrl = import.meta.env.VITE_API_URL;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '139804712217-bbb21in6u732p325tlib9n6nq4oui3lj.apps.googleusercontent.com';

// URL oficial del Backend en la nube (Render)
export const PRODUCTION_API_URL = 'https://sembriogan-backend.onrender.com';

export const API_BASE_URL = (() => {
  if (envApiUrl && envApiUrl.trim()) {
    return envApiUrl.trim().replace(/\/$/, '');
  }

  // Si estamos en el navegador:
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Si estamos en desarrollo local, conectar al servidor local:
    if (isLocalhost) {
      return 'http://localhost:3000';
    }
    // Si el frontend está montado en el mismo Render unificado con el backend:
    if (window.location.hostname.includes('sembriogan-backend.onrender.com')) {
      return '';
    }
    // Si el frontend está desplegado en Vercel, Netlify o dominio propio:
    return PRODUCTION_API_URL;
  }

  // Desarrollo o compilación estándar
  return PRODUCTION_API_URL;
})();

/**
 * Obtiene la URL completa o relativa para un endpoint de la API
 * @param {string} endpoint - Ejemplo: '/api/catalogo'
 * @returns {string} URL formateada
 */
export const getApiUrl = (endpoint = '') => {
  if (!endpoint) return API_BASE_URL || '/';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

/**
 * Obtiene la URL para imágenes y archivos subidos (/uploads/...)
 * @param {string} path - Ejemplo: '/uploads/foto.jpg'
 * @returns {string} URL formateada
 */
export const getMediaUrl = (path = '') => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default {
  API_BASE_URL,
  getApiUrl,
  getMediaUrl,
};
