import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "139804712217-bbb21in6u732p325tlib9n6nq4oui3lj.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
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