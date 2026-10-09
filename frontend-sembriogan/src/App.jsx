import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PublicHome from './pages/PublicHome';
import ChatWidget from './components/ChatWidget';
import useInactivityLogout from './hooks/useInactivityLogout';

function GlobalInactivityWatcher() {
  useInactivityLogout(15); // 15 minutos de inactividad
  return null;
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "220138760087-placeholder.apps.googleusercontent.com"; // Reemplazar con el Client ID real

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <GlobalInactivityWatcher />
        <Routes>
          {/* Ruta raíz ahora muestra la Página Web Pública */}
          <Route path="/" element={<PublicHome />} />
          
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