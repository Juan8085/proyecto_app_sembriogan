import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './config/api';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PublicHome from './pages/PublicHome';
import CatalogoTienda from './pages/CatalogoTienda';
import ChatWidget from './components/ChatWidget';
import useInactivityLogout from './hooks/useInactivityLogout';

function GlobalInactivityWatcher() {
  useInactivityLogout(15); // 15 minutos de inactividad
  return null;
}

function App() {
  useEffect(() => {
    // Si la ventana actual es el popup de retorno de Google con el token en el hash
    if (window.location.hash && window.location.hash.includes('access_token')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        localStorage.setItem('google_access_token_temp', accessToken);
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_TOKEN', token: accessToken }, '*');
          } catch (e) {}
        }
        document.body.innerHTML = '<div style="font-family:sans-serif;text-align:center;padding:50px;"><h2>✅ ¡Inicio de sesión exitoso!</h2><p>Cerrando esta ventana automáticamente...</p></div>';
        setTimeout(() => window.close(), 600);
      }
    }

    // Escuchar el mensaje emitido por el popup (postMessage)
    const handleMessage = (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_TOKEN' && event.data.token) {
        localStorage.removeItem('google_access_token_temp');
        window.dispatchEvent(new CustomEvent('sembriogan_google_token', { detail: event.data.token }));
      }
    };
    window.addEventListener('message', handleMessage);

    // Escuchar por evento storage (si window.opener fue bloqueado por políticas del navegador)
    const handleStorage = (event) => {
      if (event.key === 'google_access_token_temp' && event.newValue) {
        const token = event.newValue;
        localStorage.removeItem('google_access_token_temp');
        window.dispatchEvent(new CustomEvent('sembriogan_google_token', { detail: token }));
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <GlobalInactivityWatcher />
        <Routes>
          {/* Ruta raíz muestra la Página Web Pública con Productos Estrella */}
          <Route path="/" element={<PublicHome />} />

          {/* Rutas de Catálogo Completo / Tienda */}
          <Route path="/tienda" element={<CatalogoTienda />} />
          <Route path="/catalogo" element={<CatalogoTienda />} />
          
          {/* Rutas de Operación */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>

        {/* 
          Widget Flotante de WhatsApp e IA 
        */}
        <ChatWidget />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;