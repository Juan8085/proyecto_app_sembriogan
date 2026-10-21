// Configuración centralizada de la URL de la API y recursos multimedia
// Permite que la aplicación funcione en localhost, en red local (LAN) o a través de túneles (ngrok)
// sin necesidad de modificar el código fuente al clonar o cambiar de equipo.

const envApiUrl = import.meta.env.VITE_API_URL;

export const API_BASE_URL = (() => {
  if (envApiUrl) {
    return envApiUrl.replace(/\/$/, '');
  }

  // Si estamos en el navegador:
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Si se accede vía HTTPS (ngrok), por IP de red local o dominio externo:
    // Retornamos cadena vacía para que las llamadas sean relativas ('/api/...')
    // y pasen por el proxy de Vite, evitando bloqueos de CORS y Mixed Content.
    if (!isLocalhost || window.location.protocol === 'https:') {
      return '';
    }
  }

  // Desarrollo local estándar
  return 'http://localhost:3000';
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
